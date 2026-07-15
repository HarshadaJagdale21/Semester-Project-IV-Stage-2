# ==================================
# Question Answering using Phi3 LLM
# ==================================

from langchain_community.llms import Ollama
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA

# ------------------------------
# Load PDF
# ------------------------------

loader = PyPDFLoader("machine_learning_intro.pdf")
documents = loader.load()

# ------------------------------
# Split text
# ------------------------------

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

docs = text_splitter.split_documents(documents)

# ------------------------------
# Create embeddings
# ------------------------------

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# ------------------------------
# Vector database
# ------------------------------

vector_db = FAISS.from_documents(docs, embeddings)

# ------------------------------
# Load Phi3 model from Ollama
# ------------------------------

llm = Ollama(model="phi3")

# ------------------------------
# Create QA chain
# ------------------------------

qa = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vector_db.as_retriever()
)

# ------------------------------
# Chat loop
# ------------------------------

print("📚 Document QA System Ready")
print("Type 'exit' to stop\n")

while True:

    query = input("Ask Question: ")

    if query.lower() == "exit":
        break

    result = qa.invoke({"query": query})

    print("\nAnswer:", result["result"])
    print("\n---------------------------\n")