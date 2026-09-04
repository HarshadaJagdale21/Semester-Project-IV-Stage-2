import { pool } from "@workspace/db";
import { logger } from "./logger";
import { hashPassword } from "./auth";

const resources = [
  ["syllabus", "Machine Learning — Semester 5", "Computer Engineering", "2025-26", "Third Year", "Semester 5", "Machine Learning", "Unit 1", "Foundations, supervised learning, and model evaluation.", "PDF", "1.8 MB", "blue"],
  ["note", "Regression & Classification Notes", "Computer Engineering", "2025-26", "Third Year", "Semester 5", "Machine Learning", "Unit 2", "A concise revision guide with worked examples and exam prompts.", "PDF", "3.2 MB", "violet"],
  ["note", "Database Normalization Handbook", "Computer Engineering", "2025-26", "Third Year", "Semester 5", "DBMS", "Unit 3", "Functional dependencies, normal forms, and decomposition.", "DOCX", "1.1 MB", "mint"],
  ["question_paper", "End Semester Examination — 2024", "Computer Engineering", "2024-25", "Third Year", "Semester 5", "Machine Learning", "All Units", "Previous year question paper for revision.", "PDF", "856 KB", "amber"],
  ["note", "Computer Networks Quick Revision", "Computer Engineering", "2025-26", "Third Year", "Semester 5", "Computer Networks", "Unit 4", "Routing, congestion control, and transport layer review.", "PDF", "2.6 MB", "rose"],
  ["syllabus", "Artificial Intelligence — Semester 6", "Artificial Intelligence & Machine Learning", "2025-26", "Third Year", "Semester 6", "Artificial Intelligence", "All Units", "Search, knowledge representation, and intelligent agents.", "PDF", "1.4 MB", "blue"],
  ["note", "Operating Systems Concepts", "Computer Engineering", "2025-26", "Second Year", "Semester 4", "Operating Systems", "Unit 1", "Processes, threads, scheduling, and memory management.", "PDF", "2.0 MB", "violet"],
  ["question_paper", "Mid Semester Examination — 2023", "Information Technology", "2023-24", "Third Year", "Semester 5", "DBMS", "All Units", "Previous year internal assessment paper.", "PDF", "640 KB", "amber"],
];

const questions = [
  ["Quantitative Aptitude", "Percentages", "Easy", "A product marked at ₹800 is sold at 10% discount. What is the selling price?", ["₹700", "₹720", "₹740", "₹760"], "₹720", "Selling price = 800 × 90/100 = ₹720."],
  ["Quantitative Aptitude", "Profit and Loss", "Medium", "An article bought for ₹500 is sold for ₹575. What is the profit percentage?", ["10%", "12%", "15%", "20%"], "15%", "Profit is ₹75, so 75/500 × 100 = 15%."],
  ["Logical Reasoning", "Series", "Easy", "Find the next number: 3, 6, 12, 24, ?", ["36", "42", "48", "54"], "48", "Each number is multiplied by 2."],
  ["Logical Reasoning", "Coding-Decoding", "Medium", "If CODE is written as DPEF, how is DATA written?", ["EBUB", "EBSB", "EBUB", "DATAB"], "EBUB", "Each letter is shifted one position forward."],
  ["Verbal Ability", "Vocabulary", "Easy", "Choose the closest meaning of 'concise'.", ["Brief", "Complex", "Loud", "Unclear"], "Brief", "Concise means brief and clear."],
  ["Technical Aptitude", "DBMS", "Medium", "Which normal form removes partial dependency?", ["1NF", "2NF", "3NF", "BCNF"], "2NF", "Second normal form removes partial dependency on a composite key."],
  ["Technical Aptitude", "Python", "Easy", "Which keyword defines a function in Python?", ["func", "define", "def", "lambda"], "def", "Python uses def to declare a function."],
  ["Technical Aptitude", "Operating Systems", "Medium", "Which scheduling algorithm can cause starvation?", ["FCFS", "Round Robin", "Priority", "FIFO"], "Priority", "Low-priority processes can wait indefinitely in priority scheduling."],
  ["Quantitative Aptitude", "Time Speed Distance", "Medium", "A car travels 120 km in 3 hours. What is its average speed?", ["30 km/h", "40 km/h", "50 km/h", "60 km/h"], "40 km/h", "Speed = distance/time = 120/3 = 40 km/h."],
  ["Logical Reasoning", "Blood Relations", "Easy", "A is the brother of B. B is the sister of C. How is A related to C?", ["Father", "Brother", "Uncle", "Cousin"], "Brother", "A and C are siblings."],
];

const projects = [
  ["CampusPulse — Student Support Analytics", "Full Stack", "Intermediate", "A privacy-conscious platform that helps departments identify support needs through anonymized academic signals.", ["React", "Node.js", "PostgreSQL"], ["analytics", "education", "dashboard"]],
  ["Explainable Study Recommendation Engine", "AI / ML", "Advanced", "A recommendation system that maps student performance patterns to explainable next-best learning resources.", ["Python", "scikit-learn", "FastAPI"], ["recommendations", "machine learning", "NLP"]],
  ["Smart Library Discovery", "Web Development", "Beginner", "A searchable catalog that helps students find books by subject, difficulty, and learning goal.", ["React", "Express", "MongoDB"], ["library", "search", "books"]],
  ["Voice-free Viva Coach", "NLP", "Final Year", "A practice companion that generates viva questions from a project abstract and evaluates answer coverage.", ["Python", "Gemini", "React"], ["NLP", "viva", "project guidance"]],
];

const books = [
  ["Hands-On Machine Learning", "Aurélien Géron", "Machine Learning", "Practical coverage of model building, evaluation, and deployment.", "A strong bridge between theory and implementation for project work.", "https://www.oreilly.com/library/view/hands-on-machine-learning/9781098125974/"],
  ["Database System Concepts", "Abraham Silberschatz", "DBMS", "A comprehensive reference for relational concepts, transactions, and indexing.", "Useful for semester preparation and building reliable backend systems.", "https://www.mheducation.com/highered/product/database-system-concepts-silberschatz.html"],
  ["Computer Networking: A Top-Down Approach", "James Kurose", "Computer Networks", "Explains networking from applications down to physical foundations.", "Good for connecting exam concepts to real-world systems.", "https://www.pearson.com/en-us/subject-catalog/p/computer-networking-a-top-down-approach/P200000003267"],
  ["Deep Learning with Python", "François Chollet", "Deep Learning", "An accessible guide to practical deep learning workflows.", "Recommended for students moving from ML fundamentals to project prototypes.", "https://www.manning.com/books/deep-learning-with-python"],
];

export async function seedStudyMate(): Promise<void> {
  try {
    const resourceCount = await pool.query("SELECT COUNT(*)::int AS count FROM studymate_resources");
    if (resourceCount.rows[0]?.count === 0) {
      for (const resource of resources) {
        await pool.query(
          `INSERT INTO studymate_resources
          (kind,title,branch,academic_year,year,semester,subject,unit,description,file_type,size,accent)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          resource,
        );
      }
    }

    const questionCount = await pool.query("SELECT COUNT(*)::int AS count FROM studymate_aptitude_questions");
    if (questionCount.rows[0]?.count === 0) {
      for (let index = 0; index < 100; index += 1) {
        const source = questions[index % questions.length];
        await pool.query(
          `INSERT INTO studymate_aptitude_questions
          (category,topic,difficulty,question,options,correct_answer,explanation,marks)
          VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8)`,
          [...source.slice(0, 4), JSON.stringify(source[4]), source[5], source[6], 1],
        );
      }
    }

    const projectCount = await pool.query("SELECT COUNT(*)::int AS count FROM studymate_projects");
    if (projectCount.rows[0]?.count === 0) {
      for (const project of projects) {
        await pool.query(
          `INSERT INTO studymate_projects (title,domain,difficulty,abstract,technologies,tags)
           VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb)`,
          [...project.slice(0, 4), JSON.stringify(project[4]), JSON.stringify(project[5])],
        );
      }
    }

    const bookCount = await pool.query("SELECT COUNT(*)::int AS count FROM studymate_books");
    if (bookCount.rows[0]?.count === 0) {
      for (const book of books) {
        await pool.query(
          `INSERT INTO studymate_books (title,author,subject,description,recommendation_reason,external_link)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          book,
        );
      }
    }

    const testCount = await pool.query("SELECT COUNT(*)::int AS count FROM studymate_tests");
    if (testCount.rows[0]?.count === 0) {
      const questionIds = await pool.query("SELECT id FROM studymate_aptitude_questions ORDER BY id LIMIT 10");
      const ids = questionIds.rows.map((row) => Number(row.id));
      await pool.query(
        `INSERT INTO studymate_tests (title,category,description,difficulty,duration,total_marks,question_ids)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
        ["Placement Readiness Sprint", "Mixed Aptitude", "A focused 10-question baseline across quantitative, logical, verbal, and technical aptitude.", "Medium", 15, 10, JSON.stringify(ids)],
      );
      await pool.query(
        `INSERT INTO studymate_tests (title,category,description,difficulty,duration,total_marks,question_ids)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
        ["Technical Foundations Check", "Technical Aptitude", "A quick check of DBMS, Python, operating systems, and networking foundations.", "Medium", 12, 10, JSON.stringify(ids.slice(5).concat(ids.slice(0, 5)))],
      );
    }

    const notificationCount = await pool.query("SELECT COUNT(*)::int AS count FROM studymate_notifications");
    if (notificationCount.rows[0]?.count === 0) {
      await pool.query(
        `INSERT INTO studymate_notifications (title,message,type) VALUES
        ('New Machine Learning notes', 'Regression & Classification Notes are now available for Semester 5.', 'resource'),
        ('Placement Sprint is live', 'Try the new 15-minute aptitude baseline and see your weak topics.', 'test'),
        ('StudyMate is ready', 'Start with your dashboard and build a plan around your next assessment.', 'announcement')`,
      );
    }

    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const existing = await pool.query("SELECT id FROM studymate_users WHERE email = $1", [process.env.ADMIN_EMAIL]);
      if (existing.rowCount === 0) {
        await pool.query(
          `INSERT INTO studymate_users (name,email,password_hash,role,enrollment_number)
           VALUES ($1,$2,$3,'admin',$4)`,
          ["StudyMate Administrator", process.env.ADMIN_EMAIL, hashPassword(process.env.ADMIN_PASSWORD), "ADMIN-001"],
        );
      }
    }
  } catch (error) {
    logger.error({ err: error }, "StudyMate seed failed");
  }
}