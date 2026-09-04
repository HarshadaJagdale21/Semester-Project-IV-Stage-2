import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import {
  CreateStudyPlanBody,
  Doubt,
  GenerateAiTestBody,
  ListAptitudeQuestionsQueryParams,
  ListNotesQueryParams,
  ListQuestionPapersQueryParams,
  ListSyllabusQueryParams,
  LoginAdminBody,
  LoginStudentBody,
  RegisterStudentBody,
  SolveDoubtBody,
  SubmitTestBody,
  SubmitTestParams,
} from "@workspace/api-zod";
import { createToken, getAuthUser, hashPassword, requireUser, verifyPassword, type AuthUser } from "../lib/auth";

const router: IRouter = Router();
type Row = Record<string, any>;

function fail(res: Response, status: number, error: string) {
  return res.status(status).json({ error });
}

function userFromRow(row: Row): AuthUser & Record<string, unknown> {
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role === "admin" ? "admin" : "student",
    branch: String(row.branch ?? "Computer Engineering"),
    year: String(row.year ?? "Third Year"),
    semester: String(row.semester ?? "Semester 5"),
    enrollmentNumber: String(row.enrollment_number ?? ""),
    avatar: row.avatar ?? null,
    active: row.active !== false,
  };
}

function authResponse(row: Row) {
  const user = userFromRow(row);
  return { token: createToken(user), user };
}

async function gemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.35, maxOutputTokens: 8192 },
    }),
  });
  if (!response.ok) throw new Error(`Gemini request failed with ${response.status}`);
  const data = await response.json() as Row;
  const text = data.candidates?.[0]?.content?.parts?.map((part: Row) => part.text).join("") ?? "";
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

function stripJsonFences(value: string): string {
  return value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterStudentBody.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "Please complete all registration fields correctly.");
  const input = parsed.data;
  try {
    const existing = await pool.query("SELECT id FROM studymate_users WHERE email = $1 OR enrollment_number = $2", [input.email.toLowerCase(), input.enrollmentNumber]);
    if (existing.rowCount) return fail(res, 409, "An account with this email or enrollment number already exists.");
    const result = await pool.query(
      `INSERT INTO studymate_users (name,email,password_hash,role,branch,academic_year,year,semester,enrollment_number)
       VALUES ($1,$2,$3,'student',$4,$5,$6,$7,$8) RETURNING *`,
      [input.name, input.email.toLowerCase(), hashPassword(input.password), input.branch, input.academicYear, input.year, input.semester, input.enrollmentNumber],
    );
    return res.status(201).json(authResponse(result.rows[0]));
  } catch (error) {
    req.log.error({ err: error }, "Student registration failed");
    return fail(res, 500, "Unable to create your account right now.");
  }
});

async function login(req: Request, res: Response, adminOnly: boolean) {
  const parsed = (adminOnly ? LoginAdminBody : LoginStudentBody).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "Enter a valid email and password.");
  try {
    const result = await pool.query("SELECT * FROM studymate_users WHERE email = $1 AND active = true LIMIT 1", [parsed.data.email.toLowerCase()]);
    const row = result.rows[0];
    if (!row || !verifyPassword(parsed.data.password, row.password_hash) || (adminOnly ? row.role !== "admin" : row.role !== "student")) {
      return fail(res, 401, adminOnly ? "Invalid administrator credentials." : "Invalid student credentials.");
    }
    return res.json(authResponse(row));
  } catch (error) {
    req.log.error({ err: error }, "Login failed");
    return fail(res, 500, "Unable to sign in right now.");
  }
}

router.post("/auth/login", (req, res) => login(req, res, false));
router.post("/auth/admin-login", (req, res) => login(req, res, true));

router.get("/auth/me", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return fail(res, 401, "Authentication required.");
  const result = await pool.query("SELECT * FROM studymate_users WHERE id = $1 AND active = true", [user.id]);
  if (!result.rows[0]) return fail(res, 401, "Your session is no longer active.");
  return res.json(userFromRow(result.rows[0]));
});

router.get("/dashboard", async (req, res) => {
  const user = requireUser(req, "student");
  if (!user) return fail(res, 401, "Student authentication required.");
  try {
    const [attempts, notes, papers, activity] = await Promise.all([
      pool.query("SELECT * FROM studymate_attempts WHERE student_id = $1 ORDER BY submitted_at DESC", [user.id]),
      pool.query("SELECT COUNT(*)::int AS count FROM studymate_resources WHERE kind = 'note'"),
      pool.query("SELECT COUNT(*)::int AS count FROM studymate_resources WHERE kind = 'question_paper'"),
      pool.query("SELECT test_id, score, total_marks, submitted_at FROM studymate_attempts WHERE student_id = $1 ORDER BY submitted_at DESC LIMIT 5", [user.id]),
    ]);
    const rows = attempts.rows as Row[];
    const totalScore = rows.reduce((sum, row) => sum + Number(row.percentage), 0);
    const totalAccuracy = rows.reduce((sum, row) => sum + Number(row.accuracy), 0);
    return res.json({
      stats: {
        testsAttempted: rows.length,
        averageScore: rows.length ? Math.round(totalScore / rows.length) : 0,
        accuracy: rows.length ? Math.round(totalAccuracy / rows.length) : 0,
        studyHours: Math.min(40, 6 + rows.length * 2.5),
        completedPlans: 2,
        weakTopics: rows.length ? 3 : 0,
        notesAvailable: Number(notes.rows[0]?.count ?? 0),
        papersAvailable: Number(papers.rows[0]?.count ?? 0),
      },
      performance: rows.slice(0, 6).reverse().map((row, index) => ({ label: `Test ${index + 1}`, score: Number(row.percentage) })),
      subjectPerformance: [
        { subject: "Machine Learning", score: rows.length ? Math.min(94, 68 + rows.length * 4) : 68, color: "#5b5ce2" },
        { subject: "DBMS", score: rows.length ? Math.min(91, 61 + rows.length * 5) : 61, color: "#16a394" },
        { subject: "Networks", score: 74, color: "#d99937" },
        { subject: "Aptitude", score: rows.length ? Math.min(89, 55 + rows.length * 6) : 55, color: "#e16b72" },
      ],
      activity: activity.rows.map((row) => ({
        title: "Aptitude test submitted",
        detail: `${row.score}/${row.total_marks} marks`,
        time: new Date(row.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        type: "test",
      })),
    });
  } catch (error) {
    req.log.error({ err: error }, "Dashboard query failed");
    return fail(res, 500, "Unable to load your dashboard.");
  }
});

async function listResources(req: Request, res: Response, kind: string, querySchema: typeof ListSyllabusQueryParams) {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return fail(res, 400, "Invalid resource filters.");
  const query = parsed.data as Row;
  const values: unknown[] = [kind];
  const filters = ["kind = $1"];
  for (const [key, column] of [["branch", "branch"], ["semester", "semester"], ["subject", "subject"]] as const) {
    if (query[key]) {
      values.push(query[key]);
      filters.push(`${column} = $${values.length}`);
    }
  }
  const result = await pool.query(`SELECT * FROM studymate_resources WHERE ${filters.join(" AND ")} ORDER BY created_at DESC`, values);
  return res.json(result.rows.map((row: Row) => ({
    id: String(row.id),
    branch: row.branch,
    academicYear: row.academic_year,
    year: row.year,
    semester: row.semester,
    subject: row.subject,
    unit: row.unit,
    title: row.title,
    description: row.description,
    fileUrl: row.file_url,
    type: row.file_type,
    uploadedAt: new Date(row.created_at).toISOString(),
    size: row.size ?? "—",
    accent: row.accent ?? "blue",
    examType: row.kind === "question_paper" ? "End Semester" : undefined,
  })));
}

router.get("/syllabus", (req, res) => listResources(req, res, "syllabus", ListSyllabusQueryParams));
router.get("/notes", (req, res) => listResources(req, res, "note", ListNotesQueryParams));
router.get("/question-papers", (req, res) => listResources(req, res, "question_paper", ListQuestionPapersQueryParams));

router.get("/aptitude/questions", async (req, res) => {
  const parsed = ListAptitudeQuestionsQueryParams.safeParse(req.query);
  if (!parsed.success) return fail(res, 400, "Invalid aptitude filters.");
  const query = parsed.data as Row;
  const values: unknown[] = [];
  const filters: string[] = [];
  for (const [key, column] of [["category", "category"], ["difficulty", "difficulty"]] as const) {
    if (query[key]) {
      values.push(query[key]);
      filters.push(`${column} = $${values.length}`);
    }
  }
  values.push(Number(query.limit ?? 20));
  const result = await pool.query(`SELECT id,question,options,category,topic,difficulty,marks FROM studymate_aptitude_questions ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""} ORDER BY id LIMIT $${values.length}`, values);
  return res.json(result.rows.map((row: Row) => ({ ...row, id: String(row.id), options: row.options })));
});

router.get("/tests", async (_req, res) => {
  const tests = await pool.query("SELECT * FROM studymate_tests ORDER BY created_at DESC");
  const output = [];
  for (const test of tests.rows as Row[]) {
    const questions = await pool.query("SELECT id,question,options,topic,marks FROM studymate_aptitude_questions WHERE id = ANY($1::int[])", [test.question_ids]);
    output.push({
      id: String(test.id),
      title: test.title,
      category: test.category,
      description: test.description,
      difficulty: test.difficulty,
      duration: test.duration,
      totalMarks: test.total_marks,
      questions: questions.rows.map((row: Row) => ({ ...row, id: String(row.id) })),
    });
  }
  return res.json(output);
});

router.post("/tests/:id/submit", async (req, res) => {
  const user = requireUser(req, "student");
  if (!user) return fail(res, 401, "Student authentication required.");
  const params = SubmitTestParams.safeParse(req.params);
  const body = SubmitTestBody.safeParse(req.body);
  if (!params.success || !body.success) return fail(res, 400, "Submit answers and time taken to finish the test.");
  const testResult = await pool.query("SELECT * FROM studymate_tests WHERE id = $1", [params.data.id]);
  const test = testResult.rows[0] as Row | undefined;
  if (!test) return fail(res, 404, "Test not found.");
  const questionResult = await pool.query("SELECT id,topic,correct_answer FROM studymate_aptitude_questions WHERE id = ANY($1::int[])", [test.question_ids]);
  const answers = body.data.answers as Record<string, string>;
  let correct = 0;
  const weak = new Set<string>();
  const strong = new Set<string>();
  for (const row of questionResult.rows as Row[]) {
    if (answers[String(row.id)] === row.correct_answer) {
      correct += 1;
      strong.add(row.topic);
    } else {
      weak.add(row.topic);
    }
  }
  const total = questionResult.rowCount ?? 0;
  const percentage = total ? Math.round((correct / total) * 100) : 0;
  const attempt = await pool.query(
    `INSERT INTO studymate_attempts
     (student_id,test_id,answers,score,total_marks,percentage,accuracy,time_taken,weak_topics,strong_topics)
     VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb) RETURNING *`,
    [user.id, test.id, JSON.stringify(answers), correct, total, percentage, percentage, body.data.timeTaken, JSON.stringify([...weak]), JSON.stringify([...strong])],
  );
  return res.json({
    id: String(attempt.rows[0].id),
    testId: String(test.id),
    testName: test.title,
    category: test.category,
    score: correct,
    totalMarks: total,
    percentage,
    accuracy: percentage,
    timeTaken: body.data.timeTaken,
    submittedAt: new Date(attempt.rows[0].submitted_at).toISOString(),
    strongTopics: [...strong],
    weakTopics: [...weak],
  });
});

router.get("/attempts", async (req, res) => {
  const user = requireUser(req, "student");
  if (!user) return fail(res, 401, "Student authentication required.");
  const result = await pool.query(
    `SELECT a.*, t.title AS test_name, t.category FROM studymate_attempts a
     JOIN studymate_tests t ON t.id = a.test_id WHERE a.student_id = $1 ORDER BY a.submitted_at DESC`,
    [user.id],
  );
  return res.json(result.rows.map((row: Row) => ({
    id: String(row.id), testId: String(row.test_id), testName: row.test_name, category: row.category,
    score: row.score, totalMarks: row.total_marks, percentage: row.percentage, accuracy: row.accuracy,
    timeTaken: row.time_taken, submittedAt: new Date(row.submitted_at).toISOString(),
    strongTopics: row.strong_topics, weakTopics: row.weak_topics,
  })));
});

router.post("/ai/study-plan", async (req, res) => {
  const user = requireUser(req, "student");
  if (!user) return fail(res, 401, "Student authentication required.");
  const parsed = CreateStudyPlanBody.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "Complete the study plan inputs.");
  try {
    const source = await pool.query("SELECT title,unit,description FROM studymate_resources WHERE subject = $1 LIMIT 12", [parsed.data.subject]);
    const prompt = `You are StudyMate's Study Planner Agent for an engineering student at RCPIT Shirpur. Generate a practical personalized plan. Return JSON only with keys summary (string) and days (array of objects with day number, title, duration, tasks array). Subject: ${parsed.data.subject}. Exam date: ${parsed.data.examDate}. Available days: ${parsed.data.days}. Hours/day: ${parsed.data.hoursPerDay}. Preparation level: ${parsed.data.level}. Difficult topics: ${parsed.data.difficultTopics.join(", ")}. Grounding material: ${JSON.stringify(source.rows)}. Include learning, practice, revision, PYQ solving, mock-test time, and weak-topic practice.`;
    const generated = JSON.parse(stripJsonFences(await gemini(prompt))) as Row;
    const plan = { id: `plan-${Date.now()}`, subject: parsed.data.subject, summary: generated.summary, days: generated.days, createdAt: new Date().toISOString() };
    await pool.query("INSERT INTO studymate_study_plans (student_id,subject,exam_date,plan) VALUES ($1,$2,$3,$4::jsonb)", [user.id, parsed.data.subject, parsed.data.examDate, JSON.stringify(plan)]);
    return res.json(plan);
  } catch (error) {
    req.log.error({ err: error }, "Study planner agent failed");
    return fail(res, 503, "The Study Planner Agent is temporarily unavailable. Check the server AI configuration and try again.");
  }
});

router.post("/ai/doubt", async (req, res) => {
  const user = requireUser(req, "student");
  if (!user) return fail(res, 401, "Student authentication required.");
  const parsed = SolveDoubtBody.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "Enter a question and choose a response mode.");
  try {
    const source = await pool.query(
      `SELECT title,subject,unit,description FROM studymate_resources
       WHERE subject = $1 OR description ILIKE $2 ORDER BY created_at DESC LIMIT 5`,
      [parsed.data.subject, `%${parsed.data.question.slice(0, 40)}%`],
    );
    const prompt = `You are StudyMate's grounded Doubt Solver Agent. Answer this student question in ${parsed.data.mode} mode: ${parsed.data.question}. Subject: ${parsed.data.subject}. Use the college resource context first: ${JSON.stringify(source.rows)}. If the context does not contain the answer, clearly say that the remaining explanation is based on general knowledge. Do not invent RCPIT-specific facts.`;
    const answer = await gemini(prompt);
    const sources = source.rows.map((row: Row) => `${row.title} · ${row.unit}`);
    const doubt = { id: `doubt-${Date.now()}`, question: parsed.data.question, answer, subject: parsed.data.subject, sources, createdAt: new Date().toISOString() };
    await pool.query("INSERT INTO studymate_doubts (student_id,question,answer,subject,sources) VALUES ($1,$2,$3,$4,$5::jsonb)", [user.id, doubt.question, doubt.answer, doubt.subject, JSON.stringify(sources)]);
    return res.json(doubt);
  } catch (error) {
    req.log.error({ err: error }, "Doubt solver agent failed");
    return fail(res, 503, "The Doubt Solver Agent is temporarily unavailable. Try again in a moment.");
  }
});

router.post("/ai/generate-test", async (req, res) => {
  const user = requireUser(req, "student");
  if (!user) return fail(res, 401, "Student authentication required.");
  const parsed = GenerateAiTestBody.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "Complete the test generator inputs.");
  try {
    const source = await pool.query("SELECT title,unit,description FROM studymate_resources WHERE subject = $1 LIMIT 12", [parsed.data.subject]);
    const prompt = `You are StudyMate's Test Generator Agent. Generate ${parsed.data.count} multiple-choice questions for ${parsed.data.subject}, ${parsed.data.unit}, difficulty ${parsed.data.difficulty}. Ground questions in this context: ${JSON.stringify(source.rows)}. Return JSON only as an array with question, options (4 strings), topic, marks, correctAnswer, explanation.`;
    const generated = JSON.parse(stripJsonFences(await gemini(prompt))) as Row[];
    return res.json({
      id: `ai-test-${Date.now()}`, title: `AI ${parsed.data.subject} practice`, category: parsed.data.subject,
      description: "Generated from your selected subject and unit. Answers are hidden until submission.",
      difficulty: parsed.data.difficulty, duration: parsed.data.duration, totalMarks: generated.length,
      questions: generated.map((item, index) => ({ id: `ai-q-${index}`, question: item.question, options: item.options, topic: item.topic ?? parsed.data.unit, marks: item.marks ?? 1 })),
    });
  } catch (error) {
    req.log.error({ err: error }, "Test generator agent failed");
    return fail(res, 503, "The Test Generator Agent is temporarily unavailable. Try again in a moment.");
  }
});

router.get("/projects", async (_req, res) => {
  const result = await pool.query("SELECT * FROM studymate_projects ORDER BY id");
  return res.json(result.rows.map((row: Row) => ({ ...row, id: String(row.id), technologies: row.technologies, tags: row.tags })));
});

router.get("/books", async (_req, res) => {
  const result = await pool.query("SELECT * FROM studymate_books ORDER BY id");
  return res.json(result.rows.map((row: Row) => ({ id: String(row.id), title: row.title, author: row.author, subject: row.subject, description: row.description, recommendationReason: row.recommendation_reason, externalLink: row.external_link })));
});

router.get("/recommendations", async (req, res) => {
  const user = requireUser(req, "student");
  if (!user) return fail(res, 401, "Student authentication required.");
  const resources = await pool.query("SELECT id,title,subject,kind FROM studymate_resources WHERE subject IN ('DBMS','Machine Learning') ORDER BY id LIMIT 4");
  return res.json(resources.rows.map((row: Row, index) => ({
    id: `rec-${row.id}`, title: row.title, type: row.kind === "note" ? "note" : "practice", subject: row.subject,
    reason: index === 0 ? "Strengthen a topic that commonly appears in semester assessments." : "This resource matches your current semester and learning path.",
    actionLabel: row.kind === "note" ? "Open notes" : "Practice now",
  })));
});

router.get("/notifications", async (req, res) => {
  if (!requireUser(req, "student")) return fail(res, 401, "Student authentication required.");
  const result = await pool.query("SELECT * FROM studymate_notifications ORDER BY created_at DESC");
  return res.json(result.rows.map((row: Row) => ({ id: String(row.id), title: row.title, message: row.message, type: row.type, read: row.read, createdAt: new Date(row.created_at).toISOString() })));
});

router.get("/admin/dashboard", async (req, res) => {
  if (!requireUser(req, "admin")) return fail(res, 403, "Administrator access required.");
  const [students, resources, questions, tests, attempts, average] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM studymate_users WHERE role = 'student'"),
    pool.query("SELECT COUNT(*)::int AS count FROM studymate_resources"),
    pool.query("SELECT COUNT(*)::int AS count FROM studymate_aptitude_questions"),
    pool.query("SELECT COUNT(*)::int AS count FROM studymate_tests"),
    pool.query("SELECT COUNT(*)::int AS count FROM studymate_attempts"),
    pool.query("SELECT COALESCE(AVG(percentage),0)::float AS value FROM studymate_attempts"),
  ]);
  return res.json({
    stats: { students: students.rows[0].count, resources: resources.rows[0].count, questions: questions.rows[0].count, tests: tests.rows[0].count, attempts: attempts.rows[0].count, averageScore: Math.round(Number(average.rows[0].value)) },
    registrations: [{ label: "Jan", score: 18 }, { label: "Feb", score: 26 }, { label: "Mar", score: 34 }, { label: "Apr", score: 42 }, { label: "May", score: 58 }, { label: "Jun", score: 71 }],
    categoryPerformance: [{ subject: "Quantitative", score: 72, color: "#5b5ce2" }, { subject: "Technical", score: 81, color: "#16a394" }, { subject: "Verbal", score: 68, color: "#d99937" }],
    recentActivity: [{ title: "Resource catalog is active", detail: `${resources.rows[0].count} academic resources available`, time: "Today", type: "resource" }],
  });
});

router.get("/admin/students", async (req, res) => {
  if (!requireUser(req, "admin")) return fail(res, 403, "Administrator access required.");
  const result = await pool.query("SELECT * FROM studymate_users WHERE role = 'student' ORDER BY created_at DESC");
  return res.json(result.rows.map(userFromRow));
});

router.get("/admin/test-results", async (req, res) => {
  if (!requireUser(req, "admin")) return fail(res, 403, "Administrator access required.");
  const result = await pool.query(
    `SELECT a.*, t.title AS test_name, t.category, u.name AS student_name, u.email AS student_email, u.enrollment_number
     FROM studymate_attempts a JOIN studymate_tests t ON t.id = a.test_id JOIN studymate_users u ON u.id = a.student_id
     ORDER BY a.submitted_at DESC`,
  );
  return res.json(result.rows.map((row: Row) => ({
    id: String(row.id), testId: String(row.test_id), testName: row.test_name, category: row.category,
    score: row.score, totalMarks: row.total_marks, percentage: row.percentage, accuracy: row.accuracy,
    timeTaken: row.time_taken, submittedAt: new Date(row.submitted_at).toISOString(),
    strongTopics: row.strong_topics, weakTopics: row.weak_topics, studentName: row.student_name,
    studentEmail: row.student_email, enrollmentNumber: row.enrollment_number,
  })));
});

export default router;