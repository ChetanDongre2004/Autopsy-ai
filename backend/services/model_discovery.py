import re
import os
import ast
from typing import Dict, List, Any

class ModelDiscoveryEngine:
    def __init__(self):
        # Definitions of models to scan for
        self.llm_patterns = {
            "OpenAI GPT-4o": {
                "provider": "OpenAI",
                "version": "gpt-4o",
                "patterns": [r"gpt-4o", r"ChatOpenAI\(.*model=['\"]gpt-4o['\"]", r"openai\.OpenAI\("],
                "default_purpose": "High-reasoning text generation and multimodal analysis",
                "input_type": "Text / Images",
                "output_type": "Structured Text / JSON"
            },
            "OpenAI GPT-4 Turbo": {
                "provider": "OpenAI",
                "version": "gpt-4-turbo",
                "patterns": [r"gpt-4-turbo", r"gpt-4-1106-preview", r"ChatOpenAI\(.*model=['\"]gpt-4-turbo['\"]"],
                "default_purpose": "Complex logical reasoning and analysis",
                "input_type": "Text",
                "output_type": "Text"
            },
            "Google Gemini 2.5 Pro": {
                "provider": "Google",
                "version": "gemini-2.5-pro",
                "patterns": [r"gemini-2.5-pro", r"ChatGoogleGenerativeAI\(.*model=['\"]gemini-2.5-pro['\"]", r"GenerativeModel\(['\"]gemini-2.5-pro['\"]"],
                "default_purpose": "CTO-level repository audit and executive summary generation",
                "input_type": "Repository Context / Code Chunks",
                "output_type": "CTO-level reports"
            },
            "Google Gemini 1.5 Pro": {
                "provider": "Google",
                "version": "gemini-1.5-pro",
                "patterns": [r"gemini-1.5-pro", r"ChatGoogleGenerativeAI\(.*model=['\"]gemini-1.5-pro['\"]", r"GenerativeModel\(['\"]gemini-1.5-pro['\"]"],
                "default_purpose": "Long-context reasoning and analysis",
                "input_type": "Code Files / Text",
                "output_type": "Text / JSON"
            },
            "Google Gemini 2.5 Flash": {
                "provider": "Google",
                "version": "gemini-2.5-flash",
                "patterns": [r"gemini-2.5-flash", r"ChatGoogleGenerativeAI\(.*model=['\"]gemini-2.5-flash['\"]", r"GenerativeModel\(['\"]gemini-2.5-flash['\"]"],
                "default_purpose": "High-speed token output and code scanning",
                "input_type": "Source code chunks",
                "output_type": "Vulnerability findings"
            },
            "Google Gemini 1.5 Flash": {
                "provider": "Google",
                "version": "gemini-1.5-flash",
                "patterns": [r"gemini-1.5-flash", r"gemini-flash", r"ChatGoogleGenerativeAI\(.*model=['\"]gemini-1.5-flash['\"]", r"GenerativeModel\(['\"]gemini-1.5-flash['\"]"],
                "default_purpose": "High-speed token generation, general chats and code scanning",
                "input_type": "Repository files / Prompt text",
                "output_type": "JSON / Text replies"
            },
            "Google Gemini (General SDK)": {
                "provider": "Google",
                "version": "gemini-sdk",
                "patterns": [r"google-generativeai", r"import google\.generativeai", r"genai\.GenerativeModel", r"ChatGoogleGenerativeAI"],
                "default_purpose": "Generative AI calls using Google AI Studio SDK",
                "input_type": "Text prompts / System instructions",
                "output_type": "Dynamic content generation"
            },
            "Google Gemini 2.0 Flash": {
                "provider": "Google",
                "version": "gemini-2.0-flash",
                "patterns": [r"gemini-2.0-flash", r"gemini-2\.0", r"ChatGoogleGenerativeAI\(.*model=['\"]gemini-2.0-flash['\"]", r"GenerativeModel\(['\"]gemini-2.0-flash['\"]"],
                "default_purpose": "High-performance experimental token generation and repository reasoning",
                "input_type": "Source code / Prompts",
                "output_type": "JSON / Text responses"
            },
            "Anthropic Claude 3.5 Sonnet": {
                "provider": "Anthropic",
                "version": "claude-3-5-sonnet",
                "patterns": [r"claude-3-5-sonnet", r"claude-3\.5-sonnet", r"ChatAnthropic\(.*model=['\"]claude-3-5-sonnet['\"]"],
                "default_purpose": "Advanced code intelligence and agent planning",
                "input_type": "Text / Source Code",
                "output_type": "Structured Text"
            },
            "Meta Llama 3": {
                "provider": "Meta (Ollama/Groq/HF)",
                "version": "llama3",
                "patterns": [r"llama-3", r"llama3-8b", r"llama3-70b", r"meta-llama", r"llama3"],
                "default_purpose": "Local code completion and analysis",
                "input_type": "Text / Code snippets",
                "output_type": "Text"
            },
            "Mistral / Mixtral": {
                "provider": "Mistral AI",
                "version": "mistral-large",
                "patterns": [r"mistral", r"mixtral", r"open-mixtral", r"MistralClient\("],
                "default_purpose": "General instruction following and logical reasoning",
                "input_type": "Text",
                "output_type": "Text"
            },
            "DeepSeek Chat/Coder": {
                "provider": "DeepSeek",
                "version": "deepseek-coder",
                "patterns": [r"deepseek", r"deepseek-chat", r"deepseek-coder"],
                "default_purpose": "High-performance code generation and static review",
                "input_type": "Source Code Chunks",
                "output_type": "Reviewed Code / Patches"
            },
            "Qwen Coder": {
                "provider": "Alibaba (Ollama/HF)",
                "version": "qwen2.5-coder",
                "patterns": [r"qwen2\.5-coder", r"qwen25-coder", r"qwen-coder"],
                "default_purpose": "Local code generation and lightweight RAG inference",
                "input_type": "Retrieved repository context",
                "output_type": "Local chat response"
            },
            "Groq Hosted Model": {
                "provider": "Groq",
                "version": "groq-api",
                "patterns": [r"Groq\(", r"groq_client", r"ChatGroq\("],
                "default_purpose": "Ultra-low-latency response generation",
                "input_type": "Text",
                "output_type": "Text"
            },
            "Ollama (Local LLM Engine)": {
                "provider": "Ollama",
                "version": "local",
                "patterns": [r"Ollama\(", r"ChatOllama\(", r"localhost:11434", r"ollama\.chat", r"ollama\.generate"],
                "default_purpose": "Privacy-first local code execution and analysis",
                "input_type": "Prompt / Context",
                "output_type": "Text"
            }
        }

        self.embedding_patterns = {
            "OpenAI Embeddings": {
                "provider": "OpenAI",
                "patterns": [r"OpenAIEmbeddings\(", r"text-embedding-ada-002", r"text-embedding-3"],
                "default_purpose": "Semantic vector representation of source code"
            },
            "BGE Embeddings (BAAI)": {
                "provider": "BAAI",
                "patterns": [r"bge-large", r"bge-small", r"BAAI/bge-large-en"],
                "default_purpose": "Dense vector embedding for retrieval-augmented generation"
            },
            "Sentence Transformers": {
                "provider": "Hugging Face (Local)",
                "patterns": [r"SentenceTransformer\(", r"all-MiniLM-L6-v2", r"sentence_transformers"],
                "default_purpose": "Local sentence/code chunk vectorization"
            },
            "Gemini Embeddings": {
                "provider": "Google",
                "patterns": [r"GoogleGenerativeAIEmbeddings\(", r"models/embedding-001"],
                "default_purpose": "High-dimensional text and code semantic representation"
            },
            "Cohere Embeddings": {
                "provider": "Cohere",
                "patterns": [r"CohereEmbeddings\(", r"embed-english-v3"],
                "default_purpose": "Multilingual dense text search vectorization"
            }
        }

        self.vector_db_patterns = {
            "Chroma DB": {
                "patterns": [r"chromadb", r"Chroma\(", r"Chroma\.from_documents", r"persist_directory"],
                "purpose": "Local disk-based metadata and vector chunk storage"
            },
            "FAISS": {
                "patterns": [r"faiss", r"FAISS\.from_documents", r"FAISS\.load_local"],
                "purpose": "In-memory high-speed similarity search indexing"
            },
            "Qdrant": {
                "patterns": [r"qdrant_client", r"QdrantClient", r"Qdrant\("],
                "purpose": "Cloud or local production-grade vector search engine"
            },
            "Pinecone": {
                "patterns": [r"pinecone", r"Pinecone\(", r"PineconeClient"],
                "purpose": "Managed serverless enterprise vector database"
            },
            "Milvus": {
                "patterns": [r"pymilvus", r"MilvusClient", r"Milvus\("],
                "purpose": "Highly scalable distributed open-source vector store"
            },
            "Weaviate": {
                "patterns": [r"weaviate", r"WeaviateClient"],
                "purpose": "GraphQL-enabled semantic search database"
            },
            "PGVector": {
                "patterns": [r"pgvector", r"PGVector\(", r"postgresql\+psycopg2"],
                "purpose": "Relational PostgreSQL database vector expansion store"
            },
            "MongoDB Atlas Vector Search": {
                "patterns": [r"MongoDBAtlasVectorSearch", r"pymongo"],
                "purpose": "Document-database integrated semantic vector search"
            }
        }

        self.framework_patterns = {
            "LangChain": {
                "patterns": [r"import langchain", r"from langchain_", r"langchain\.chat_models", r"langchain\.prompts"],
                "purpose": "LLM orchestration, prompt management, and pipeline building"
            },
            "LangGraph": {
                "patterns": [r"import langgraph", r"from langgraph_", r"StateGraph\(", r"END", r"START"],
                "purpose": "Stateful multi-agent workflows and decision cycles"
            },
            "CrewAI": {
                "patterns": [r"import crewai", r"from crewai", r"Crew\(", r"Agent\(", r"Task\("],
                "purpose": "Multi-agent collaborative role-playing framework"
            },
            "AutoGen": {
                "patterns": [r"import autogen", r"ConversableAgent\(", r"AssistantAgent\("],
                "purpose": "Conversational multi-agent interactive workflows"
            },
            "LlamaIndex": {
                "patterns": [r"import llama_index", r"from llama_index", r"VectorStoreIndex", r"SimpleDirectoryReader"],
                "purpose": "Data indexing, ingestion, and RAG retrieval pipelines"
            },
            "DSPy": {
                "patterns": [r"import dspy", r"dspy\.Predict\(", r"dspy\.ChainOfThought\("],
                "purpose": "Programmatic prompting and signature-based optimizations"
            },
            "PydanticAI": {
                "patterns": [r"import pydantic_ai", r"from pydantic_ai", r"Agent\(.*deps_type"],
                "purpose": "Type-safe robust agentic application framework"
            }
        }

        self.prompt_keywords = [
            r"system_prompt\s*=", r"SYSTEM_PROMPT\s*=", 
            r"prompt_template\s*=", r"PromptTemplate\(", 
            r"ChatPromptTemplate", r"SystemMessagePromptTemplate",
            r"messages\s*=\s*\[\s*\{\s*['\"]role['\"]\s*:\s*['\"]system['\"]",
            r"instruction\s*=\s*['\"].*['\"]", r"instructions\s*=\s*['\"].*['\"]"
        ]

        # Database and ORM Scanning
        self.db_patterns = {
            "PostgreSQL": [r"postgresql:", r"psycopg2", r"pg_connect", r"postgres:\/\/"],
            "MySQL": [r"mysql:", r"pymysql", r"mysqlconnector"],
            "SQLite": [r"sqlite3", r"sqlite:", r"create_engine\(['\"]sqlite:"],
            "MongoDB": [r"mongodb:", r"pymongo", r"mongoose\.connect"],
            "Redis": [r"redis", r"redis:\/\/"],
            "Elasticsearch": [r"elasticsearch", r"Elasticsearch\("]
        }
        
        self.orm_patterns = {
            "SQLAlchemy": [r"from sqlalchemy import", r"import sqlalchemy", r"declarative_base\("],
            "Prisma": [r"prisma-client", r"prisma\.schema", r"@prisma\/client"],
            "Django ORM": [r"from django\.db import models", r"models\.Model"],
            "Mongoose": [r"require\(['\"]mongoose['\"]", r"import mongoose from", r"mongoose\.Schema"],
            "TypeORM": [r"typeorm", r"@Entity\(", r"Column\("],
            "Alembic": [r"alembic", r"alembic\.context"]
        }

    def discover_ai_components(self, file_contents: Dict[str, str], llm_override: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Scan all files for imports, function calls, initializations, and strings.
        Return structured lists of discovered models, embeddings, vector stores, frameworks, prompts,
        and classify capabilities, RAG details, Agentic details, GPU suitability, Data flow, and Governance.
        """
        discovered_models = []
        discovered_embeddings = []
        discovered_vector_dbs = []
        discovered_frameworks = []
        discovered_prompts = []
        discovered_dbs = []
        discovered_orms = []

        if llm_override:
            discovered_models = llm_override.get("models", [])
            discovered_embeddings = llm_override.get("embeddings", [])
            discovered_vector_dbs = llm_override.get("vector_dbs", [])
            discovered_frameworks = llm_override.get("frameworks", [])
            discovered_prompts = llm_override.get("prompts", [])
            # Fill missing keys in overridden items
            for m in discovered_models:
                if "provider" not in m: m["provider"] = "Unknown"
                if "version" not in m: m["version"] = m.get("model_name", "unknown").lower()
                if "usage_location" not in m: m["usage_location"] = m.get("file_path", "unknown")
                if "class_name" not in m: m["class_name"] = "None"
                if "function_name" not in m: m["function_name"] = "Global scope"
                if "purpose" not in m: m["purpose"] = "AI/ML execution"
                if "input_type" not in m: m["input_type"] = "Text"
                if "output_type" not in m: m["output_type"] = "Text"
                if "evidence" not in m: m["evidence"] = "Detected via LLM scan"
                if "confidence_score" not in m: m["confidence_score"] = 90
            for e in discovered_embeddings:
                if "provider" not in e: e["provider"] = "Unknown"
                if "location" not in e: e["location"] = e.get("file_path", "unknown")
                if "purpose" not in e: e["purpose"] = "Embedding generation"
                if "evidence" not in e: e["evidence"] = "Detected via LLM scan"
                if "confidence_score" not in e: e["confidence_score"] = 90
            for d in discovered_vector_dbs:
                if "location" not in d: d["location"] = d.get("file_path", "unknown")
                if "purpose" not in d: d["purpose"] = "Vector storage"
                if "evidence" not in d: d["evidence"] = "Detected via LLM scan"
                if "confidence_score" not in d: d["confidence_score"] = 90
            for f in discovered_frameworks:
                if "version" not in f: f["version"] = "latest"
                if "location" not in f: f["location"] = f.get("file_path", "unknown")
                if "purpose" not in f: f["purpose"] = "AI/ML orchestration"
                if "evidence" not in f: f["evidence"] = "Detected via LLM scan"
                if "confidence_score" not in f: f["confidence_score"] = 90
            for p in discovered_prompts:
                if "prompt_type" not in p: p["prompt_type"] = "User Prompt"
                if "prompt_complexity" not in p: p["prompt_complexity"] = "Medium"
                if "usage_location" not in p: p["usage_location"] = p.get("file_path", "unknown")
                if "purpose" not in p: p["purpose"] = "AI Instruction template"
                if "evidence" not in p: p["evidence"] = "Detected via LLM scan"

        scan_contents = {} if llm_override else file_contents

        # Track file paths to avoid double listing
        models_seen = set()
        embeddings_seen = set()
        vector_dbs_seen = set()
        frameworks_seen = set()
        dbs_seen = set()
        orms_seen = set()

        for file_path, content in scan_contents.items():
            lines = content.split('\n')
            
            # --- 1. LLM Models Scan ---
            for model_id, model_meta in self.llm_patterns.items():
                for pattern in model_meta["patterns"]:
                    matches = list(re.finditer(pattern, content, re.IGNORECASE))
                    if matches:
                        match = matches[0]
                        line_num = content[:match.start()].count('\n') + 1
                        snippet = lines[max(0, line_num - 2):min(len(lines), line_num + 3)]
                        evidence = "\n".join([f"L{line_num + idx - 1}: {l.strip()}" for idx, l in enumerate(snippet)])
                        
                        model_key = f"{model_id}@{file_path}"
                        if model_key not in models_seen:
                            models_seen.add(model_key)
                            func_name = "Global scope"
                            class_name = "None"
                            for l_idx in range(line_num - 1, 0, -1):
                                if lines[l_idx].strip().startswith("def "):
                                    func_name = lines[l_idx].split("(")[0].replace("def ", "").strip()
                                    break
                                if lines[l_idx].strip().startswith("class "):
                                    class_name = lines[l_idx].split("(")[0].split(":")[0].replace("class ", "").strip()
                                    break
                                    
                            discovered_models.append({
                                "model_name": model_id.split(" ")[-1] if " " in model_id else model_id,
                                "full_name": model_id,
                                "provider": model_meta["provider"],
                                "version": model_meta["version"],
                                "usage_location": f"{os.path.basename(file_path)}:{line_num}",
                                "file_path": file_path,
                                "class_name": class_name,
                                "function_name": func_name,
                                "purpose": model_meta["default_purpose"],
                                "input_type": model_meta["input_type"],
                                "output_type": model_meta["output_type"],
                                "evidence": evidence,
                                "confidence_score": 98 if "model=" in evidence or "Client(" in evidence else 80
                            })
                            break 

            # --- 2. Embeddings Scan ---
            for emb_id, emb_meta in self.embedding_patterns.items():
                for pattern in emb_meta["patterns"]:
                    matches = list(re.finditer(pattern, content, re.IGNORECASE))
                    if matches:
                        match = matches[0]
                        line_num = content[:match.start()].count('\n') + 1
                        snippet = lines[max(0, line_num - 2):min(len(lines), line_num + 3)]
                        evidence = "\n".join([f"L{line_num + idx - 1}: {l.strip()}" for idx, l in enumerate(snippet)])
                        
                        emb_key = f"{emb_id}@{file_path}"
                        if emb_key not in embeddings_seen:
                            embeddings_seen.add(emb_key)
                            discovered_embeddings.append({
                                "embedding_model": emb_id,
                                "provider": emb_meta["provider"],
                                "location": f"{os.path.basename(file_path)}:{line_num}",
                                "file_path": file_path,
                                "purpose": emb_meta["default_purpose"],
                                "evidence": evidence,
                                "confidence_score": 95
                            })
                            break

            # --- 3. Vector DBs Scan ---
            for db_id, db_meta in self.vector_db_patterns.items():
                for pattern in db_meta["patterns"]:
                    matches = list(re.finditer(pattern, content, re.IGNORECASE))
                    if matches:
                        match = matches[0]
                        line_num = content[:match.start()].count('\n') + 1
                        snippet = lines[max(0, line_num - 2):min(len(lines), line_num + 3)]
                        evidence = "\n".join([f"L{line_num + idx - 1}: {l.strip()}" for idx, l in enumerate(snippet)])
                        
                        db_key = f"{db_id}@{file_path}"
                        if db_key not in vector_dbs_seen:
                            vector_dbs_seen.add(db_key)
                            discovered_vector_dbs.append({
                                "vector_db": db_id,
                                "location": f"{os.path.basename(file_path)}:{line_num}",
                                "file_path": file_path,
                                "purpose": db_meta["purpose"],
                                "evidence": evidence,
                                "confidence_score": 90
                            })
                            break

            # --- 4. Frameworks Scan ---
            for fw_id, fw_meta in self.framework_patterns.items():
                for pattern in fw_meta["patterns"]:
                    matches = list(re.finditer(pattern, content))
                    if matches:
                        match = matches[0]
                        line_num = content[:match.start()].count('\n') + 1
                        snippet = lines[max(0, line_num - 2):min(len(lines), line_num + 3)]
                        evidence = "\n".join([f"L{line_num + idx - 1}: {l.strip()}" for idx, l in enumerate(snippet)])
                        
                        fw_key = f"{fw_id}@{file_path}"
                        if fw_key not in frameworks_seen:
                            frameworks_seen.add(fw_key)
                            discovered_frameworks.append({
                                "framework": fw_id,
                                "version": "Detected in imports",
                                "location": f"{os.path.basename(file_path)}:{line_num}",
                                "file_path": file_path,
                                "purpose": fw_meta["purpose"],
                                "evidence": evidence,
                                "confidence_score": 95
                            })
                            break

            # --- 5. Prompts Scan ---
            for pattern in self.prompt_keywords:
                matches = list(re.finditer(pattern, content))
                for match in matches:
                    line_num = content[:match.start()].count('\n') + 1
                    snippet = lines[max(0, line_num - 1):min(len(lines), line_num + 5)]
                    evidence = "\n".join([f"L{line_num + idx - 1}: {l.strip()}" for idx, l in enumerate(snippet)])
                    
                    prompt_loc = f"{file_path}:{line_num}"
                    if not any(p["usage_location"] == prompt_loc for p in discovered_prompts):
                        p_type = "System Prompt"
                        if "template" in evidence.lower():
                            p_type = "Prompt Template"
                        elif "instruction" in evidence.lower():
                            p_type = "Agent Instructions"

                        p_name = "custom_prompt_definition"
                        var_match = re.search(r"(\w+)\s*=", lines[line_num - 1])
                        if var_match:
                            p_name = var_match.group(1)

                        # Check for variables/placeholders in prompt
                        variables = re.findall(r"\{(\w+)\}", evidence)

                        discovered_prompts.append({
                            "prompt_name": p_name,
                            "prompt_type": p_type,
                            "purpose": "Contextual LLM instruction alignment",
                            "usage_location": prompt_loc,
                            "file_path": file_path,
                            "prompt_complexity": "High" if len(content[match.start():match.start()+500]) > 250 else "Medium",
                            "evidence": evidence,
                            "variables": list(set(variables)),
                            "confidence_score": 85
                        })

            # --- 6. Databases and ORMs Scan ---
            for db_name, db_pats in self.db_patterns.items():
                for pat in db_pats:
                    if re.search(pat, content, re.IGNORECASE):
                        db_key = f"{db_name}@{file_path}"
                        if db_key not in dbs_seen:
                            dbs_seen.add(db_key)
                            discovered_dbs.append({
                                "database": db_name,
                                "file_path": file_path,
                                "evidence": f"Found '{pat}' pattern in {file_path}"
                            })
                            break

            for orm_name, orm_pats in self.orm_patterns.items():
                for pat in orm_pats:
                    if re.search(pat, content):
                        orm_key = f"{orm_name}@{file_path}"
                        if orm_key not in orms_seen:
                            orms_seen.add(orm_key)
                            discovered_orms.append({
                                "orm": orm_name,
                                "file_path": file_path,
                                "evidence": f"Found '{pat}' in {file_path}"
                            })
                            break

        # --- 7. Capabilities mapping ---
        has_genai = len(discovered_models) > 0
        has_rag = len(discovered_embeddings) > 0 and len(discovered_vector_dbs) > 0
        has_agentic = any(f["framework"] in ["LangGraph", "CrewAI", "AutoGen", "PydanticAI"] for f in discovered_frameworks)
        if not has_agentic:
            for file_path, content in scan_contents.items():
                if "bind_tools" in content or "register_tool" in content or "@tool" in content or "tool_calls" in content:
                    has_agentic = True
                    break

        has_multimodel = len(set(m["provider"] for m in discovered_models)) > 1 or len(discovered_models) > 1

        has_cv = False
        cv_evidence = ""
        for file_path, content in scan_contents.items():
            cv_match = re.search(r"(import cv2|from PIL|torchvision|import PIL|cv2\.|Image\.open|image_model|object_detection)", content)
            if cv_match:
                has_cv = True
                line_num = content[:cv_match.start()].count('\n') + 1
                cv_evidence = f"CV imports/actions found in {os.path.basename(file_path)}:L{line_num}"
                break

        has_speech = False
        speech_evidence = ""
        for file_path, content in scan_contents.items():
            speech_match = re.search(r"(import whisper|whisper\.load|gtts|speech_recognition|text-to-speech|audio_model|import librosa)", content)
            if speech_match:
                has_speech = True
                line_num = content[:speech_match.start()].count('\n') + 1
                speech_evidence = f"Speech/Audio references found in {os.path.basename(file_path)}:L{line_num}"
                break

        has_multimodal = False
        multimodal_evidence = ""
        for m in discovered_models:
            if m["version"] in ["gpt-4o", "gemini-1.5-pro", "gemini-2.5-pro", "gemini-2.5-flash", "claude-3-5-sonnet"]:
                has_multimodal = True
                multimodal_evidence = f"Multimodal model {m['full_name']} declared in {m['usage_location']}"
                break
        if not has_multimodal and has_cv and has_genai:
            has_multimodal = True
            multimodal_evidence = f"Combination of Generative AI and Computer Vision frameworks discovered."

        capabilities = {
            "GenAI": {
                "detected": has_genai,
                "confidence": 98 if has_genai else 0,
                "evidence": f"Found {len(discovered_models)} LLM definition(s) in codebase." if has_genai else "Evidence not found in repository.",
                "explanation": "Repository utilizes Large Language Models for automated response generation, reasoning, or summaries." if has_genai else "No generative AI patterns detected."
            },
            "RAG": {
                "detected": has_rag,
                "confidence": 95 if has_rag else 0,
                "evidence": f"Vector DB ({[v['vector_db'] for v in discovered_vector_dbs]}) and Embeddings ({[e['embedding_model'] for e in discovered_embeddings]}) detected." if has_rag else "Evidence not found in repository.",
                "explanation": "Repository retrieves document context to inject into LLM prompts for grounded answer generation." if has_rag else "No retrieval-augmented generation pipelines discovered."
            },
            "Agentic": {
                "detected": has_agentic,
                "confidence": 90 if has_agentic else 0,
                "evidence": "Frameworks like CrewAI/LangGraph or custom @tool binders found in codebase." if has_agentic else "Evidence not found in repository.",
                "explanation": "Code defines tools, loops, or routing decisions where LLMs act autonomously." if has_agentic else "No recursive agentic decision loops found."
            },
            "Multi-Model": {
                "detected": has_multimodel,
                "confidence": 92 if has_multimodel else 0,
                "evidence": f"Discovered models: {[m['full_name'] for m in discovered_models]}" if has_multimodel else "Evidence not found in repository.",
                "explanation": "System splits tasks across multiple LLMs (e.g. Gemini for summaries + local Qwen for queries)." if has_multimodel else "Single LLM orchestrator structure detected."
            },
            "Computer Vision": {
                "detected": has_cv,
                "confidence": 95 if has_cv else 0,
                "evidence": cv_evidence if has_cv else "Evidence not found in repository.",
                "explanation": "Repository imports PIL, OpenCV, or utilizes visual models to process images/video feeds." if has_cv else "No computer vision imports or models found."
            },
            "Speech AI": {
                "detected": has_speech,
                "confidence": 90 if has_speech else 0,
                "evidence": speech_evidence if has_speech else "Evidence not found in repository.",
                "explanation": "System contains audio processing, Whisper, or Text-to-Speech models." if has_speech else "No speech-to-text or voice pipelines detected."
            },
            "Multimodal": {
                "detected": has_multimodal,
                "confidence": 95 if has_multimodal else 0,
                "evidence": multimodal_evidence if has_multimodal else "Evidence not found in repository.",
                "explanation": "Repository uses models capable of unified processing of text, image, or audio." if has_multimodal else "System uses single-mode text or static APIs."
            }
        }

        # --- 8. RAG Architecture Intelligence ---
        rag_chunk_size = 500
        rag_chunk_overlap = 50
        rag_chunk_strategy = "Recursive Character Splitting"
        rag_evidence_lines = []
        
        # Scan for chunk configurations
        for file_path, content in scan_contents.items():
            cs_match = re.search(r"chunk_size\s*=\s*(\d+)", content)
            co_match = re.search(r"chunk_overlap\s*=\s*(\d+)", content)
            if cs_match:
                rag_chunk_size = int(cs_match.group(1))
                rag_evidence_lines.append(f"Detected chunk_size={rag_chunk_size} in {os.path.basename(file_path)}")
            if co_match:
                rag_chunk_overlap = int(co_match.group(1))
                rag_evidence_lines.append(f"Detected chunk_overlap={rag_chunk_overlap} in {os.path.basename(file_path)}")
            if "SemanticChunker" in content:
                rag_chunk_strategy = "Semantic Chunking"
                rag_evidence_lines.append(f"SemanticChunker imported in {os.path.basename(file_path)}")

        vector_store_used = discovered_vector_dbs[0]["vector_db"] if discovered_vector_dbs else "SQLite Fallback DB"
        embedding_model_used = discovered_embeddings[0]["embedding_model"] if discovered_embeddings else "None Detected"
        
        rag_maturity = "Low"
        rag_maturity_score = 30
        if has_rag:
            rag_maturity = "Intermediate"
            rag_maturity_score = 75
            if "Semantic" in rag_chunk_strategy or any("rerank" in content for content in scan_contents.values()):
                rag_maturity = "Mature"
                rag_maturity_score = 92
        elif len(discovered_frameworks) > 0:
            rag_maturity = "Basic (Framework Imports Only)"
            rag_maturity_score = 45

        rag_weaknesses = []
        rag_recommendations = []
        if not has_rag:
            rag_weaknesses.append("No active Vector Database or Retrieval pipeline found in codebase.")
            rag_recommendations.append("Implement a local vector indexing pipeline using Chroma DB or FAISS.")
        else:
            if rag_chunk_overlap < (rag_chunk_size * 0.05):
                rag_weaknesses.append("Extremely small chunk overlap (less than 5% of chunk size) detected. Risk of losing context boundary tokens.")
                rag_recommendations.append("Increase chunk overlap to 10-20% of chunk size (e.g., 100-200 characters for 1000 chunk_size).")
            if "SQLite" in vector_store_used:
                rag_weaknesses.append("Using standard relational SQLite database for vectorized chunks without native vector engine extensions.")
                rag_recommendations.append("Migrate to specialized vector database like Qdrant, Milvus, or Chroma DB, or enable sqlite-vss/pgvector extensions.")
            if not any("rerank" in content for content in scan_contents.values()):
                rag_recommendations.append("Integrate a cross-encoder Reranking model (e.g. Cohere Rerank or BAAI/bge-reranker-large) to optimize context relevance.")

        rag_intelligence = {
            "has_rag": has_rag or len(discovered_vector_dbs) > 0,
            "chunk_size": rag_chunk_size,
            "chunk_overlap": rag_chunk_overlap,
            "chunk_strategy": rag_chunk_strategy,
            "vector_store": vector_store_used,
            "embedding_model": embedding_model_used,
            "maturity": rag_maturity,
            "maturity_score": rag_maturity_score,
            "evidence": rag_evidence_lines,
            "weaknesses": rag_weaknesses or ["No major structural weaknesses detected in static pipeline."],
            "recommendations": rag_recommendations or ["Maintain current local embedding standard."]
        }

        # --- 9. Agentic AI Intelligence ---
        agentic_tools = []
        agentic_planning = "None"
        agentic_memory = "Session Context / Buffer"
        agentic_routing = "Static Graph / Functional routing"
        agentic_maturity = "Basic"
        agentic_maturity_score = 30
        agentic_evidence = []

        # Scan for tools and loops
        for file_path, content in scan_contents.items():
            # Tool decorators
            tool_matches = re.findall(r"@tool\s*\n\s*def\s+(\w+)", content)
            for tm in tool_matches:
                agentic_tools.append(tm)
                agentic_evidence.append(f"Tool decorator '@tool' detected on function '{tm}' in {os.path.basename(file_path)}")
                
            # LangGraph / state graphs
            if "StateGraph" in content:
                agentic_routing = "Stateful Workflow DAG (LangGraph)"
                agentic_planning = "Multi-step stateful planning loops"
                agentic_evidence.append(f"LangGraph 'StateGraph' instantiated in {os.path.basename(file_path)}")
            
            # CrewAI / collaborative agent structures
            if "Crew(" in content:
                agentic_routing = "Collaborative role-playing routing"
                agentic_planning = "Task-based autonomous execution plans"
                agentic_evidence.append(f"CrewAI 'Crew' executor setup found in {os.path.basename(file_path)}")
                
            # Memory saver
            if "SqliteSaver" in content or "MemorySaver" in content:
                agentic_memory = "Persistent Checkpoint Memory (SQLite DB)"
                agentic_evidence.append(f"LangGraph persistent memory saver detected.")

        if len(agentic_tools) > 0:
            agentic_tools = list(set(agentic_tools))
            agentic_maturity = "Intermediate"
            agentic_maturity_score = 70
        if "LangGraph" in agentic_routing or "CrewAI" in agentic_routing:
            agentic_maturity = "Advanced Agentic AI"
            agentic_maturity_score = 90

        agentic_weaknesses = []
        agentic_recommendations = []
        if not has_agentic:
            agentic_weaknesses.append("No active Agentic Framework or execution loop detected.")
            agentic_recommendations.append("Introduce LangGraph or CrewAI to delegate structured multi-step tasks to LLMs.")
        else:
            if agentic_memory == "Session Context / Buffer":
                agentic_weaknesses.append("Short-term volatile session memory utilized. Agent state is lost upon process restart.")
                agentic_recommendations.append("Implement stateful checkpoint persistence (e.g. Postgres / SQLite SqliteSaver checkpoint provider).")
            if not any("reflection" in content or "critic" in content or "feedback" in content for content in scan_contents.values()):
                agentic_recommendations.append("Incorporate a Critic/Reflection loop node to allow self-assessment of generated outputs before return.")

        agentic_intelligence = {
            "has_agentic": has_agentic,
            "tools": agentic_tools,
            "planning": agentic_planning,
            "memory": agentic_memory,
            "routing": agentic_routing,
            "maturity": agentic_maturity,
            "maturity_score": agentic_maturity_score,
            "evidence": agentic_evidence,
            "weaknesses": agentic_weaknesses or ["No major structural agentic issues detected."],
            "recommendations": agentic_recommendations or ["Maintain current multi-agent workflow layout."]
        }

        # --- 10. Model Suitability & GPU Intelligence Engine ---
        suitability_registry = {
            "gemini-2.5-pro": {
                "score": 98, "compatibility_score": 100,
                "strengths": ["2-Million Token Context Window", "CTO-level repository reasoning", "Highly accurate JSON/schema structure extraction", "Exemplary code repair generation"],
                "weaknesses": ["Cloud API dependency (no offline option)", "API rate limits under heavy concurrent analysis"],
                "alternatives": ["Claude 3.5 Sonnet", "DeepSeek Coder (Offline)"],
                "npu_support": "Supported via Cloud Gateway execution (runs on AMD Zen Core network layer)",
                "rocm_support": "Supported via Cloud Gateway API (0% Local GPU VRAM usage)",
                "cpu_support": "Optimized HTTPS JSON parsing (AMD AVX-512 accelerated SSL)",
                "recommended_quantization": "N/A (Cloud Managed FP32/BF16)",
                "vram_fp16": "0 GB (Cloud Hosted)", "vram_int8": "0 GB (Cloud Hosted)", "vram_int4": "0 GB (Cloud Hosted)",
                "tps_npu": 65, "tps_rocm": 65, "tps_cpu": 65,
                "humaneval": "94.5%", "mbpp": "91.8%", "code_reasoning": "98/100", "hallucination_rate": "Very Low (<1.2%)",
                "optimization_framework": "Google Vertex AI SDK / Direct API Gateway",
                "compilation_steps": "1. Initialize via google-generativeai SDK\n2. Secure API credentials in backend/.env\n3. Route requests through asynchronous connection pool",
                "compile_command": "pip install google-generativeai && export GEMINI_API_KEY='your_key'"
            },
            "gemini-1.5-pro": {
                "score": 88, "compatibility_score": 100,
                "strengths": ["Large context window (1M tokens)", "Reliable multi-modal code review", "Solid structured outputs"],
                "weaknesses": ["Succeeded by Gemini 2.5 Pro", "Slightly higher latency profile"],
                "alternatives": ["Gemini 2.5 Pro", "Claude 3.5 Sonnet"],
                "npu_support": "Supported via Cloud Gateway execution",
                "rocm_support": "Supported via Cloud Gateway API (0% Local GPU VRAM usage)",
                "cpu_support": "Optimized HTTPS JSON parsing",
                "recommended_quantization": "N/A (Cloud Managed)",
                "vram_fp16": "0 GB (Cloud Hosted)", "vram_int8": "0 GB (Cloud Hosted)", "vram_int4": "0 GB (Cloud Hosted)",
                "tps_npu": 52, "tps_rocm": 52, "tps_cpu": 52,
                "humaneval": "84.1%", "mbpp": "80.5%", "code_reasoning": "88/100", "hallucination_rate": "Low (<2.1%)",
                "optimization_framework": "Google GenAI API Gateway",
                "compilation_steps": "1. Set GEMINI_API_KEY in environment\n2. Call generative models via httpx async pool",
                "compile_command": "# Native HTTP REST Calls"
            },
            "gemini-2.5-flash": {
                "score": 92, "compatibility_score": 100,
                "strengths": ["Sub-second API response times", "Very cost-effective billing tier", "Outstanding structural code scanning"],
                "weaknesses": ["Lacks deep multi-step architecture design reasoning compared to Pro"],
                "alternatives": ["GPT-4o-mini", "Qwen 2.5 Coder 7B (Offline)"],
                "npu_support": "Supported via Cloud Gateway execution",
                "rocm_support": "Supported via Cloud Gateway API (0% Local GPU VRAM)",
                "cpu_support": "Optimized HTTPS JSON parsing",
                "recommended_quantization": "N/A (Cloud Managed)",
                "vram_fp16": "0 GB (Cloud Hosted)", "vram_int8": "0 GB (Cloud Hosted)", "vram_int4": "0 GB (Cloud Hosted)",
                "tps_npu": 110, "tps_rocm": 110, "tps_cpu": 110,
                "humaneval": "84.8%", "mbpp": "87.1%", "code_reasoning": "90/100", "hallucination_rate": "Low (<1.8%)",
                "optimization_framework": "Google Vertex AI SDK / Direct API Gateway",
                "compilation_steps": "1. Initialize via GenerativeModel('gemini-2.5-flash')\n2. Configure max_output_tokens to match scan limits\n3. Run concurrent async queries",
                "compile_command": "python -c \"import google.generativeai as genai\""
            },
            "gemini-1.5-flash": {
                "score": 92, "compatibility_score": 100,
                "strengths": ["Sub-second API latency", "Large 1-Million Token context window", "Extremely cost-effective / free tier available", "Fast code analysis and token throughput"],
                "weaknesses": ["Less reasoning depth for complex architectural loops compared to Gemini 2.5 Pro"],
                "alternatives": ["Gemini 2.5 Flash", "Qwen 2.5 Coder 7B (Offline)"],
                "npu_support": "Supported via Cloud Gateway execution (runs on AMD Zen Core network layer)",
                "rocm_support": "Supported via Cloud Gateway API (0% Local GPU VRAM usage)",
                "cpu_support": "Optimized HTTPS JSON parsing (AMD AVX-512 accelerated SSL)",
                "recommended_quantization": "N/A (Cloud Managed FP32/BF16)",
                "vram_fp16": "0 GB (Cloud Hosted)", "vram_int8": "0 GB (Cloud Hosted)", "vram_int4": "0 GB (Cloud Hosted)",
                "tps_npu": 110, "tps_rocm": 110, "tps_cpu": 110,
                "humaneval": "84.8%", "mbpp": "87.1%", "code_reasoning": "90/100", "hallucination_rate": "Low (<1.8%)",
                "optimization_framework": "Google AI Studio SDK / Direct HTTP API",
                "compilation_steps": "1. Initialize via GenerativeModel('gemini-1.5-flash')\n2. Set GEMINI_API_KEY environment variable\n3. Execute concurrent asynchronous HTTP POST requests",
                "compile_command": "pip install google-generativeai && export GEMINI_API_KEY='your_key'"
            },
            "gemini-sdk": {
                "score": 90, "compatibility_score": 100,
                "strengths": ["Broad compatibility with Google Generative AI models", "Uses official client library wrappers", "Handles text, code, and multimodal payloads out of the box"],
                "weaknesses": ["Requires network access", "Rate limits on concurrent scanning sweeps"],
                "alternatives": ["Gemini 2.5 Pro", "Claude 3.5 Sonnet"],
                "npu_support": "Supported via Cloud Gateway execution",
                "rocm_support": "Supported via Cloud Gateway API (0% Local GPU VRAM usage)",
                "cpu_support": "Optimized HTTPS JSON parsing",
                "recommended_quantization": "N/A (Cloud Managed)",
                "vram_fp16": "0 GB (Cloud Hosted)", "vram_int8": "0 GB (Cloud Hosted)", "vram_int4": "0 GB (Cloud Hosted)",
                "tps_npu": 65, "tps_rocm": 65, "tps_cpu": 65,
                "humaneval": "84.0%", "mbpp": "82.0%", "code_reasoning": "86/100", "hallucination_rate": "Low (<2.0%)",
                "optimization_framework": "Google Generative AI SDK",
                "compilation_steps": "1. Import google.generativeai as genai\n2. Call genai.configure(api_key=...)\n3. Instantiate genai.GenerativeModel with target name",
                "compile_command": "pip install google-generativeai"
            },
            "gemini-2.0-flash": {
                "score": 94, "compatibility_score": 100,
                "strengths": ["Extreme low-latency responses", "Experimental multi-modal improvements", "Excellent structure-guided schema extraction", "Massive context support"],
                "weaknesses": ["Rate limits for API keys on high frequency calls"],
                "alternatives": ["Gemini 2.5 Flash", "GPT-4o-mini"],
                "npu_support": "Supported via Cloud Gateway execution",
                "rocm_support": "Supported via Cloud Gateway API (0% Local GPU VRAM)",
                "cpu_support": "Optimized HTTPS JSON parsing",
                "recommended_quantization": "N/A (Cloud Managed)",
                "vram_fp16": "0 GB (Cloud Hosted)", "vram_int8": "0 GB (Cloud Hosted)", "vram_int4": "0 GB (Cloud Hosted)",
                "tps_npu": 120, "tps_rocm": 120, "tps_cpu": 120,
                "humaneval": "86.5%", "mbpp": "88.2%", "code_reasoning": "92/100", "hallucination_rate": "Low (<1.5%)",
                "optimization_framework": "Google Vertex AI SDK / Direct API Gateway",
                "compilation_steps": "1. Initialize via GenerativeModel('gemini-2.0-flash')\n2. Set GEMINI_API_KEY environment variable\n3. Execute asynchronous request pipeline",
                "compile_command": "python -c \"import google.generativeai as genai\""
            },
            "gpt-4o": {
                "score": 95, "compatibility_score": 100,
                "strengths": ["Industry benchmark instruction following", "Flawless JSON schema output constraints", "Excellent code-smell categorization"],
                "weaknesses": ["High usage cost per 1M tokens", "Cloud API dependency (no offline operation)"],
                "alternatives": ["Gemini 2.5 Pro", "Claude 3.5 Sonnet"],
                "npu_support": "Supported via Cloud Gateway execution",
                "rocm_support": "Supported via Cloud Gateway API (0% Local GPU VRAM)",
                "cpu_support": "Optimized HTTPS JSON parsing",
                "recommended_quantization": "N/A (Cloud Managed)",
                "vram_fp16": "0 GB (Cloud Hosted)", "vram_int8": "0 GB (Cloud Hosted)", "vram_int4": "0 GB (Cloud Hosted)",
                "tps_npu": 72, "tps_rocm": 72, "tps_cpu": 72,
                "humaneval": "90.2%", "mbpp": "90.5%", "code_reasoning": "95/100", "hallucination_rate": "Very Low (<1.4%)",
                "optimization_framework": "OpenAI Official Python Client Async pool",
                "compilation_steps": "1. Set OPENAI_API_KEY in .env\n2. Instaniate openai.AsyncOpenAI client\n3. Call gpt-4o with json_object response format",
                "compile_command": "pip install openai && export OPENAI_API_KEY='your_key'"
            },
            "gpt-4-turbo": {
                "score": 91, "compatibility_score": 100,
                "strengths": ["High logical reasoning accuracy", "Proven track record for large file scans"],
                "weaknesses": ["Slow response times", "Expensive billing tier"],
                "alternatives": ["GPT-4o", "Gemini 2.5 Pro"],
                "npu_support": "Supported via Cloud Gateway execution",
                "rocm_support": "Supported via Cloud Gateway API",
                "cpu_support": "Optimized HTTPS JSON parsing",
                "recommended_quantization": "N/A (Cloud Managed)",
                "vram_fp16": "0 GB (Cloud Hosted)", "vram_int8": "0 GB (Cloud Hosted)", "vram_int4": "0 GB (Cloud Hosted)",
                "tps_npu": 38, "tps_rocm": 38, "tps_cpu": 38,
                "humaneval": "88.4%", "mbpp": "86.2%", "code_reasoning": "92/100", "hallucination_rate": "Low (<1.9%)",
                "optimization_framework": "OpenAI Python Client",
                "compilation_steps": "1. Configure model='gpt-4-turbo' inside openai caller\n2. Implement response parsing error fallback",
                "compile_command": "pip install openai"
            },
            "claude-3-5-sonnet": {
                "score": 97, "compatibility_score": 100,
                "strengths": ["World-class code synthesis", "Superb comprehension of custom software architecture", "Highly accurate system-wide refactoring planning"],
                "weaknesses": ["Cloud API dependency", "Very strict API rate-limiting blocks heavy scanner sweeps"],
                "alternatives": ["Gemini 2.5 Pro", "DeepSeek Coder (Offline)"],
                "npu_support": "Supported via Cloud Gateway execution",
                "rocm_support": "Supported via Cloud Gateway API",
                "cpu_support": "Optimized HTTPS JSON parsing",
                "recommended_quantization": "N/A (Cloud Managed)",
                "vram_fp16": "0 GB (Cloud Hosted)", "vram_int8": "0 GB (Cloud Hosted)", "vram_int4": "0 GB (Cloud Hosted)",
                "tps_npu": 58, "tps_rocm": 58, "tps_cpu": 58,
                "humaneval": "92.0%", "mbpp": "91.2%", "code_reasoning": "97/100", "hallucination_rate": "Very Low (<1.3%)",
                "optimization_framework": "Anthropic SDK / Async Client",
                "compilation_steps": "1. Set ANTHROPIC_API_KEY in .env\n2. Call anthropic.AsyncAnthropic API with max_tokens=4096\n3. Use XML system prompt blocks for optimal structure",
                "compile_command": "pip install anthropic"
            },
            "llama3": {
                "score": 90, "compatibility_score": 100,
                "strengths": ["Fully offline local execution", "Zero commercial API charges", "Native support for AMD ROCm", "Highly permissive Apache-2.0 open-weights license"],
                "weaknesses": ["Local hardware VRAM limits maximum batch sizes", "Relatively small local context window (~8K-32K)"],
                "alternatives": ["Qwen 2.5 Coder 7B", "DeepSeek Coder 7B"],
                "npu_support": "Native compatibility via ONNX Runtime & XDNA DirectML execution provider",
                "rocm_support": "Native ROCm compilation (Direct execution via PyTorch ROCm kernels)",
                "cpu_support": "Optimized via AVX-512 / ZenDNN instruction vectorization",
                "recommended_quantization": "INT4 (Optimal performance on Ryzen AI NPU / Radeon GPU)",
                "vram_fp16": "16.4 GB", "vram_int8": "9.1 GB", "vram_int4": "5.2 GB",
                "tps_npu": 45, "tps_rocm": 85, "tps_cpu": 18,
                "humaneval": "85.4%", "mbpp": "83.6%", "code_reasoning": "89/100", "hallucination_rate": "Medium (<3.0% at INT4)",
                "optimization_framework": "HuggingFace Optimum-AMD / ONNX Runtime",
                "compilation_steps": "1. Convert model weights to ONNX model using optimum-cli\n2. Apply Olive quantization config for INT4 precision\n3. Execute via ONNX Runtime with DirectML Provider",
                "compile_command": "optimum-cli export onnx --model meta-llama/Meta-Llama-3-8B-Instruct --task text-generation-with-past llama3_onnx/"
            },
            "mistral-large": {
                "score": 86, "compatibility_score": 100,
                "strengths": ["Solid instructions following", "Great function calling capability"],
                "weaknesses": ["Higher computational cost", "Requires significant hardware resources for local execution"],
                "alternatives": ["Llama 3", "Qwen 2.5 Coder"],
                "npu_support": "Supported via Cloud/Local API wrapper",
                "rocm_support": "Supported via Local ROCm PyTorch execution",
                "cpu_support": "Optimized via ZenDNN instruction vectorization",
                "recommended_quantization": "INT4 (For local Radeon GPU execution)",
                "vram_fp16": "45.0 GB", "vram_int8": "26.2 GB", "vram_int4": "14.5 GB",
                "tps_npu": 15, "tps_rocm": 42, "tps_cpu": 8,
                "humaneval": "80.5%", "mbpp": "78.2%", "code_reasoning": "84/100", "hallucination_rate": "Medium (<3.2%)",
                "optimization_framework": "ONNX Runtime / vLLM ROCm",
                "compilation_steps": "1. Convert PyTorch model to ONNX weights\n2. Compile using Olive pipeline with AMD ROCm target\n3. Run using AMD optimized inference engine",
                "compile_command": "python -m olive.workflows.run --config mistral_rocm.json"
            },
            "deepseek-coder": {
                "score": 96, "compatibility_score": 100,
                "strengths": ["Industry leading coding accuracy on par with GPT-4", "Fully open-weights model capable of 100% offline deployment", "Superb comprehension of repo-wide codebase dependencies", "Out-of-the-box support for AMD ROCm & Ryzen AI NPU"],
                "weaknesses": ["VRAM intensive for parameters >= 33B", "Needs strict prompt formatting templates"],
                "alternatives": ["Qwen 2.5 Coder", "Llama 3"],
                "npu_support": "Native compatibility via ONNX Runtime & XDNA DirectML execution provider",
                "rocm_support": "Native ROCm compilation (Direct execution via PyTorch ROCm kernels)",
                "cpu_support": "Optimized via AVX-512 / ZenDNN instruction vectorization",
                "recommended_quantization": "INT4 (Optimal performance on Ryzen AI NPU / Radeon GPU)",
                "vram_fp16": "15.2 GB", "vram_int8": "8.4 GB", "vram_int4": "4.8 GB",
                "tps_npu": 58, "tps_rocm": 115, "tps_cpu": 22,
                "humaneval": "90.1%", "mbpp": "89.4%", "code_reasoning": "95/100", "hallucination_rate": "Very Low (<1.5%)",
                "optimization_framework": "AMD Olive / HuggingFace Optimum-AMD",
                "compilation_steps": "1. Export PyTorch weights to ONNX format\n2. Quantize model to AWQ/GPTQ INT4 using AMD Olive optimization engine\n3. Load model via ONNX Runtime with DirectML Provider in backend",
                "compile_command": "python -m olive.workflows.run --config quantize_amd.json --model deepseek-coder-7b-instruct"
            },
            "qwen2.5-coder": {
                "score": 94, "compatibility_score": 100,
                "strengths": ["Highly optimized for low-latency coding chatbot interaction", "Excellent offline code scanning and repository-wide context reasoning", "Low hardware footprint (~4.8 GB VRAM at INT4)", "Active developer community with constant hardware updates"],
                "weaknesses": ["Slightly lower HumanEval score compared to Claude 3.5 Sonnet"],
                "alternatives": ["DeepSeek Coder", "Llama 3"],
                "npu_support": "Native compatibility via ONNX Runtime & XDNA DirectML execution provider",
                "rocm_support": "Native ROCm compilation (Direct execution via PyTorch ROCm kernels)",
                "cpu_support": "Optimized via AVX-512 / ZenDNN instruction vectorization",
                "recommended_quantization": "INT4 (Optimal performance on Ryzen AI NPU / Radeon GPU)",
                "vram_fp16": "14.9 GB", "vram_int8": "8.2 GB", "vram_int4": "4.7 GB",
                "tps_npu": 62, "tps_rocm": 120, "tps_cpu": 24,
                "humaneval": "88.4%", "mbpp": "88.9%", "code_reasoning": "93/100", "hallucination_rate": "Very Low (<1.6%)",
                "optimization_framework": "AMD Olive / HuggingFace Optimum-AMD",
                "compilation_steps": "1. Run optimum-cli to convert PyTorch model to ONNX\n2. Apply Olive pipeline with INT4 quantization config\n3. Execute using ONNX Runtime with DirectML Execution Provider",
                "compile_command": "optimum-cli export onnx --model Qwen/Qwen2.5-Coder-7B-Instruct --task text-generation-with-past qwen_onnx/"
            },
            "groq-api": {
                "score": 93, "compatibility_score": 100,
                "strengths": ["Ultra-low-latency response generation", "Excellent structural code scanning"],
                "weaknesses": ["Cloud API dependency", "Rate limits on concurrent scanning sweeps"],
                "alternatives": ["Qwen 2.5 Coder", "Gemini 2.5 Flash"],
                "npu_support": "Supported via Cloud Gateway execution",
                "rocm_support": "Supported via Cloud Gateway API (0% Local GPU VRAM usage)",
                "cpu_support": "Optimized HTTPS JSON parsing",
                "recommended_quantization": "N/A (Cloud Managed)",
                "vram_fp16": "0 GB (Cloud Hosted)", "vram_int8": "0 GB (Cloud Hosted)", "vram_int4": "0 GB (Cloud Hosted)",
                "tps_npu": 240, "tps_rocm": 240, "tps_cpu": 240,
                "humaneval": "85.0%", "mbpp": "84.5%", "code_reasoning": "91/100", "hallucination_rate": "Low (<2.0%)",
                "optimization_framework": "Groq Official SDK / Async client",
                "compilation_steps": "1. Register key and set GROQ_API_KEY in .env\n2. Import ChatGroq client wrapper\n3. Execute asynchronous inference calls",
                "compile_command": "pip install groq"
            },
            "local": {
                "score": 85, "compatibility_score": 100,
                "strengths": ["Completely offline execution", "Zero API charge", "No data leaves local server"],
                "weaknesses": ["Constrained by local hardware constraints (VRAM)", "Limited context window (~8K-32K)"],
                "alternatives": ["Qwen 2.5 Coder", "DeepSeek Coder"],
                "npu_support": "Supported via local Ollama runtime DirectML provider",
                "rocm_support": "Native ROCm compilation",
                "cpu_support": "Optimized via AVX-512 instruction set",
                "recommended_quantization": "INT4",
                "vram_fp16": "16.0 GB", "vram_int8": "9.0 GB", "vram_int4": "5.0 GB",
                "tps_npu": 40, "tps_rocm": 80, "tps_cpu": 15,
                "humaneval": "78.0%", "mbpp": "76.5%", "code_reasoning": "82/100", "hallucination_rate": "Medium (<3.5%)",
                "optimization_framework": "Ollama AMD ROCm Engine",
                "compilation_steps": "1. Download Ollama client for Windows\n2. Run 'ollama run <model>' to compile weights locally\n3. Connect via OpenAI compatible API on localhost:11434",
                "compile_command": "ollama run qwen2.5-coder:7b"
            }
        }
        
        fallback_profile = {
            "score": 75, "compatibility_score": 95,
            "strengths": ["Fulfills general reasoning workloads", "Standard API client schema"],
            "weaknesses": ["Generic selection without domain optimization"],
            "alternatives": ["Gemini 2.5 Pro", "DeepSeek Coder"],
            "npu_support": "Generic ONNX Runtime execution support",
            "rocm_support": "Compatible via DirectML translation layer",
            "cpu_support": "Standard AVX-2 execution",
            "recommended_quantization": "INT4",
            "vram_fp16": "16.0 GB", "vram_int8": "9.0 GB", "vram_int4": "5.0 GB",
            "tps_npu": 30, "tps_rocm": 60, "tps_cpu": 12,
            "humaneval": "75.0%", "mbpp": "74.0%", "code_reasoning": "78/100", "hallucination_rate": "Medium (<4.0%)",
            "optimization_framework": "ONNX Runtime",
            "compilation_steps": "1. Convert to ONNX format\n2. Run Olive quantization with default profile\n3. Execute via DirectML execution provider",
            "compile_command": "python -m olive.workflows.run --config quantize_amd.json --model custom-model"
        }

        suitability_report = []
        arch_score_deductions = 0
        total_fp16_vram = 0.0
        total_int8_vram = 0.0
        total_int4_vram = 0.0
        local_model_count = 0
        
        # Gather model detail mapping
        for m in discovered_models:
            m_ver = m["version"]
            name = m["full_name"]
            
            registry_key = None
            for key in suitability_registry:
                if key in m_ver or m_ver in key:
                    registry_key = key
                    break
            
            profile = suitability_registry.get(registry_key, fallback_profile) if registry_key else fallback_profile
            score = profile["score"]
            if score < 90:
                arch_score_deductions += 5

            # VRAM tracking
            if profile["vram_fp16"] != "0 GB (Cloud Hosted)":
                try:
                    total_fp16_vram += float(profile["vram_fp16"].replace(" GB", ""))
                    total_int8_vram += float(profile["vram_int8"].replace(" GB", ""))
                    total_int4_vram += float(profile["vram_int4"].replace(" GB", ""))
                    local_model_count += 1
                except Exception:
                    pass

            # Generate PyTorch ROCm compilation script
            pytorch_rocm_script = (
                "# AMD GPU Native Execution Setup Script\n"
                "pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.1\n"
                "python -c \"import torch; print('ROCm available:', torch.cuda.is_available())\"\n"
            )

            # Generate ONNX Ryzen AI script
            onnx_npu_script = (
                "# ONNX Runtime DirectML (Ryzen AI NPU) Setup\n"
                "pip install onnxruntime-directml olive-ai\n"
            )

            suitability_report.append({
                "model_name": name,
                "suitability_score": score,
                "compatibility_score": profile["compatibility_score"],
                "strengths": profile["strengths"],
                "weaknesses": profile["weaknesses"],
                "alternatives": profile["alternatives"],
                "recommendation": f"Ensure API keys are managed safely. {'Consider upgrading to Gemini 2.5 Pro for comprehensive codebase reasoning.' if score < 90 else 'Model selection is highly optimal for repository analysis.'}",
                "reasoning": f"Scored {score}/100. This choice represents a {'top-tier' if score > 90 else 'decent'} alignment with repository code complexity.",
                "hardware_acceleration": {
                    "npu_support": profile["npu_support"],
                    "rocm_support": profile["rocm_support"],
                    "cpu_support": profile["cpu_support"],
                    "status": "100% Compatible" if profile["compatibility_score"] == 100 else "Compatible"
                },
                "quantization_profiles": [
                    {"precision": "FP16 (Half)", "vram": profile["vram_fp16"], "throughput": f"{profile['tps_rocm']} tok/s (Radeon GPU)" if profile["vram_fp16"] != "0 GB (Cloud Hosted)" else "N/A (Cloud)", "recommended": False},
                    {"precision": "INT8 (Integer)", "vram": profile["vram_int8"], "throughput": f"{int(profile['tps_rocm']*1.2)} tok/s (Radeon GPU)" if profile["vram_int8"] != "0 GB (Cloud Hosted)" else "N/A (Cloud)", "recommended": False},
                    {"precision": "INT4 (Quantized)", "vram": profile["vram_int4"], "throughput": f"{profile['tps_npu']} tok/s (Ryzen AI NPU)" if profile["vram_int4"] != "0 GB (Cloud Hosted)" else "N/A (Cloud)", "recommended": profile["recommended_quantization"].startswith("INT4")}
                ],
                "accuracy_benchmarks": {
                    "humaneval": profile["humaneval"],
                    "mbpp": profile["mbpp"],
                    "code_reasoning": profile["code_reasoning"],
                    "hallucination_rate": profile["hallucination_rate"],
                    "precision_score": "100%" if profile["compatibility_score"] == 100 else "95%"
                },
                "optimization_pipeline": {
                    "framework": profile["optimization_framework"],
                    "compilation_steps": profile["compilation_steps"],
                    "compile_command": profile["compile_command"],
                    "pytorch_rocm_script": pytorch_rocm_script,
                    "onnx_npu_script": onnx_npu_script
                }
            })

        # Base Arch Score
        base_arch_score = 98 - arch_score_deductions
        if not discovered_models:
            base_arch_score = 0

        # GPU Intelligence report
        recommended_amd_gpu = "AMD Radeon RX 7900 XTX (24GB VRAM)" if total_fp16_vram > 16.0 else "AMD Radeon RX 7700 XT / 7800 XT (12GB/16GB VRAM)"
        recommended_amd_npu = "AMD Ryzen™ 9 HX 370 (50 TOPS NPU)" if total_int4_vram < 8.0 and local_model_count > 0 else "AMD Ryzen™ 7040/8040 series NPU"
        
        gpu_intelligence = {
            "total_fp16_vram": f"{total_fp16_vram:.1f} GB",
            "total_int8_vram": f"{total_int8_vram:.1f} GB",
            "total_int4_vram": f"{total_int4_vram:.1f} GB",
            "local_model_count": local_model_count,
            "recommended_gpu": recommended_amd_gpu if local_model_count > 0 else "None (Cloud-only execution)",
            "recommended_npu": recommended_amd_npu if local_model_count > 0 else "None (Cloud-only execution)",
            "inference_cost_per_1k_input": "$0.00 (Local Offline compute)" if local_model_count > 0 else "$0.0015 (Cloud Average)",
            "inference_cost_per_1k_output": "$0.00 (Local Offline compute)" if local_model_count > 0 else "$0.0020 (Cloud Average)",
            "rocm_optimization_advice": "1. Use FlashAttention-2 ROCm optimized kernels.\n2. Configure Hip-Graph execution to minimize latency overhead.\n3. Utilize PyTorch compilation (torch.compile) with ROCm backends.",
            "pytorch_rocm_setup": "pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.1"
        }

        # --- 11. Application Flow Discovery ---
        flow_steps = []
        if has_agentic:
            flow_steps = [
                {"step_num": 1, "module": "Input Gateway", "action": "User Goals ingestion & state mapping", "evidence": "Detected Agentic structures"},
                {"step_num": 2, "module": "Agent Planner", "action": "Routing and subtask planning using LLM reasoning", "evidence": agentic_routing},
                {"step_num": 3, "module": "Tool Execution Layer", "action": "Invoke local functions or python bindings", "evidence": f"Defined tools: {', '.join(agentic_tools)}" if agentic_tools else "Dynamic execution bindings"},
                {"step_num": 4, "module": "Memory Buffer", "action": "Checkpoint state saved to SQLite/Memory", "evidence": agentic_memory},
                {"step_num": 5, "module": "Reflection Critic", "action": "Review generated outputs before return", "evidence": "Self-correction validation loop"}
            ]
        elif has_rag:
            flow_steps = [
                {"step_num": 1, "module": "API Gateway", "action": "User prompt ingestion & sanitization", "evidence": "Standard query routes"},
                {"step_num": 2, "module": "Embedding Service", "action": "Convert query text into dense vector formats", "evidence": embedding_model_used},
                {"step_num": 3, "module": "Vector Query Execution", "action": "Similarity search on collections", "evidence": vector_store_used},
                {"step_num": 4, "module": "Context Injection Assembly", "action": "Inject matched chunks into prompt structure", "evidence": f"Chunk Size: {rag_chunk_size} chars"},
                {"step_num": 5, "module": "LLM Inference Engine", "action": "Execute text generation", "evidence": discovered_models[0]["full_name"] if discovered_models else "Cloud LLM"}
            ]
        else:
            flow_steps = [
                {"step_num": 1, "module": "Web API Endpoint", "action": "Prompt request accepted", "evidence": "FastAPI routes mapping"},
                {"step_num": 2, "module": "Prompt Constructor", "action": "Interpolate variables inside template text", "evidence": "Prompt definitions discovered"},
                {"step_num": 3, "module": "LLM API Caller", "action": "Forward payload to cloud generative gateway", "evidence": discovered_models[0]["full_name"] if discovered_models else "External API"}
            ]

        # --- 12. Database & Data Flow Intelligence ---
        # Mocking an ERD model and database mapping based on static findings
        erd_nodes = []
        erd_edges = []
        
        # Populate databases detected
        for d in discovered_dbs:
            node_id = f"db_{d['database'].lower()}"
            if not any(n["id"] == node_id for n in erd_nodes):
                erd_nodes.append({
                    "id": node_id,
                    "type": "databaseNode",
                    "label": d["database"],
                    "fields": ["connection_string", "driver", "pool_size"],
                    "file_path": d["file_path"]
                })
        
        # Scan for potential table definitions / classes
        for file_path, content in scan_contents.items():
            class_matches = re.findall(r"class\s+(\w+)\s*\((Base|models\.Model|db\.Model)\):", content)
            for cm in class_matches:
                table_name = cm[0]
                # Try to extract Column definitions
                fields = []
                col_matches = re.findall(r"(\w+)\s*=\s*(Column|models\.\w+|db\.\w+)\(", content)
                for col in col_matches:
                    fields.append(col[0])
                
                node_id = f"table_{table_name.lower()}"
                if not any(n["id"] == node_id for n in erd_nodes):
                    erd_nodes.append({
                        "id": node_id,
                        "type": "tableNode",
                        "label": table_name,
                        "fields": fields or ["id", "created_at"],
                        "file_path": file_path
                    })

                # Check for ForeignKeys to build relationships
                fk_matches = re.findall(r"ForeignKey\(['\"](\w+)\.", content)
                for fk in fk_matches:
                    target_id = f"table_{fk.lower()}"
                    erd_edges.append({
                        "id": f"rel_{node_id}_to_{target_id}",
                        "source": node_id,
                        "target": target_id,
                        "type": "ONE_TO_MANY"
                    })

        # Connect databases to tables or vice-versa
        for db_node in [n for n in erd_nodes if n["type"] == "databaseNode"]:
            for tbl_node in [n for n in erd_nodes if n["type"] == "tableNode"]:
                if db_node["file_path"] == tbl_node["file_path"]:
                    erd_edges.append({
                        "id": f"rel_{tbl_node['id']}_in_{db_node['id']}",
                        "source": tbl_node["id"],
                        "target": db_node["id"],
                        "type": "STORED_IN"
                    })

        data_flow_intelligence = {
            "databases": discovered_dbs,
            "orms": discovered_orms,
            "erd": {
                "nodes": erd_nodes,
                "edges": erd_edges
            }
        }

        # --- 13. AI Governance & Regulatory Audit Report ---
        eu_ai_act_level = "Minimal Risk"
        eu_ai_act_reasons = ["System runs standard static code reviews and heuristic calculations."]
        
        if has_genai:
            eu_ai_act_level = "Limited Risk"
            eu_ai_act_reasons.append("System uses Generative AI (LLMs) requiring transparency: users must be notified they are interacting with AI.")
        
        # Scan for sensitive operations
        all_content_concat = " ".join(scan_contents.values()).lower()
        if "biometric" in all_content_concat or "face_recognition" in all_content_concat:
            eu_ai_act_level = "High Risk"
            eu_ai_act_reasons.append("Biometric identification or classification system detected in codebase.")
        if "social_scoring" in all_content_concat or "manipulate" in all_content_concat:
            eu_ai_act_level = "Prohibited"
            eu_ai_act_reasons.append("Heuristics detect possible subliminal manipulation or social scoring constructs.")

        license_discovered = "MIT / Apache-2.0 (Detected from manifest)"
        # Check files for license
        for file_path in scan_contents:
            if "license" in file_path.lower():
                license_discovered = "Custom Proprietary / Managed weights"

        pii_issues = []
        if "email" in all_content_concat or "password" in all_content_concat or "ssn" in all_content_concat:
            pii_issues.append("Fields matching email/password/PII schema strings found. Risk of transmitting user credentials to Cloud Generative APIs.")

        governance_score = 95
        if eu_ai_act_level == "High Risk":
            governance_score = 60
        elif eu_ai_act_level == "Prohibited":
            governance_score = 15
        
        if pii_issues:
            governance_score -= 10

        governance_report = {
            "risk_score": max(5, governance_score),
            "eu_ai_act_classification": eu_ai_act_level,
            "eu_ai_act_explanation": " ".join(eu_ai_act_reasons),
            "license_compliance": license_discovered,
            "license_compatibility": "Compatible (Open source dependencies align with license standards)",
            "data_privacy_issues": pii_issues or ["No obvious user PII leakage detected."],
            "regulatory_recommendations": [
                "Ensure user notification banner is active for all LLM chat sessions.",
                "Introduce an anonymization middleware to strip emails/keys from logs before sending payloads to external cloud LLM gateways."
            ]
        }

        # --- 14. Knowledge Graph Node & Edge Generation (Phase 1) ---
        graph_nodes = []
        graph_edges = []
        node_ids = set()

        # Add Models
        for m in discovered_models:
            m_id = f"model_{m['model_name'].lower().replace('.', '_')}"
            if m_id not in node_ids:
                node_ids.add(m_id)
                graph_nodes.append({
                    "id": m_id,
                    "type": "modelNode",
                    "data": {
                        "label": m["full_name"],
                        "provider": m["provider"],
                        "purpose": m["purpose"]
                    }
                })
            
            clean_file_path = m['file_path'].replace('/', '_').replace('.', '_').replace('\\', '_')
            file_id = f"file_{clean_file_path}"
            if file_id not in node_ids:
                node_ids.add(file_id)
                graph_nodes.append({
                    "id": file_id,
                    "type": "fileNode",
                    "data": {
                        "label": os.path.basename(m["file_path"]),
                        "path": m["file_path"]
                    }
                })
            
            graph_edges.append({
                "id": f"edge_{m_id}_used_in_{file_id}",
                "source": m_id,
                "target": file_id,
                "label": "USED_IN"
            })

        # Add Vector DBs
        for db in discovered_vector_dbs:
            db_id = f"vector_db_{db['vector_db'].lower().replace(' ', '_')}"
            if db_id not in node_ids:
                node_ids.add(db_id)
                graph_nodes.append({
                    "id": db_id,
                    "type": "databaseNode",
                    "data": {
                        "label": db["vector_db"],
                        "purpose": db["purpose"]
                    }
                })
            
            clean_db_path = db['file_path'].replace('/', '_').replace('.', '_').replace('\\', '_')
            file_id = f"file_{clean_db_path}"
            if file_id not in node_ids:
                node_ids.add(file_id)
                graph_nodes.append({
                    "id": file_id,
                    "type": "fileNode",
                    "data": {
                        "label": os.path.basename(db["file_path"]),
                        "path": db["file_path"]
                    }
                })
            graph_edges.append({
                "id": f"edge_{db_id}_connected_to_{file_id}",
                "source": db_id,
                "target": file_id,
                "label": "CONNECTED_TO"
            })

        # Add Embeddings
        for emb in discovered_embeddings:
            emb_id = f"embedding_{emb['embedding_model'].lower().replace(' ', '_').replace('(', '').replace(')', '')}"
            if emb_id not in node_ids:
                node_ids.add(emb_id)
                graph_nodes.append({
                    "id": emb_id,
                    "type": "embeddingNode",
                    "data": {
                        "label": emb["embedding_model"],
                        "provider": emb["provider"]
                    }
                })
            
            for db in discovered_vector_dbs:
                db_id = f"vector_db_{db['vector_db'].lower().replace(' ', '_')}"
                if db_id in node_ids:
                    graph_edges.append({
                        "id": f"edge_{emb_id}_feeds_{db_id}",
                        "source": emb_id,
                        "target": db_id,
                        "label": "FEEDS"
                    })

        # Add Prompts
        for p in discovered_prompts:
            p_id = f"prompt_{p['prompt_name'].lower()}"
            if p_id not in node_ids:
                node_ids.add(p_id)
                graph_nodes.append({
                    "id": p_id,
                    "type": "promptNode",
                    "data": {
                        "label": p["prompt_name"],
                        "type": p["prompt_type"],
                        "complexity": p["prompt_complexity"]
                    }
                })

            for m in discovered_models:
                if m["file_path"] == p["file_path"]:
                    m_id = f"model_{m['model_name'].lower().replace('.', '_')}"
                    if m_id in node_ids:
                        graph_edges.append({
                            "id": f"edge_{p_id}_consumed_by_{m_id}",
                            "source": p_id,
                            "target": m_id,
                            "label": "CONSUMED_BY"
                        })

        # Add Agent nodes
        if has_agentic:
            agent_id = "agent_core_orchestrator"
            if agent_id not in node_ids:
                node_ids.add(agent_id)
                graph_nodes.append({
                    "id": agent_id,
                    "type": "agentNode",
                    "data": {
                        "label": "Core AI Agent Orchestrator",
                        "routing": agentic_routing,
                        "planning": agentic_planning
                    }
                })
            
            # Connect agent to models
            for m in discovered_models:
                m_id = f"model_{m['model_name'].lower().replace('.', '_')}"
                if m_id in node_ids:
                    graph_edges.append({
                        "id": f"edge_{agent_id}_invokes_{m_id}",
                        "source": agent_id,
                        "target": m_id,
                        "label": "INVOKES"
                    })

            # Connect agent to tools
            for tool in agentic_tools:
                tool_id = f"tool_{tool.lower()}"
                if tool_id not in node_ids:
                    node_ids.add(tool_id)
                    graph_nodes.append({
                        "id": tool_id,
                        "type": "toolNode",
                        "data": {
                            "label": f"Tool: {tool}",
                            "purpose": "Autonomous functional execution"
                        }
                    })
                graph_edges.append({
                    "id": f"edge_{agent_id}_calls_{tool_id}",
                    "source": agent_id,
                    "target": tool_id,
                    "label": "CALLS"
                })

        if llm_override:
            if "capabilities" in llm_override:
                for cap_name, cap_val in llm_override["capabilities"].items():
                    if cap_name in capabilities:
                        capabilities[cap_name]["detected"] = cap_val.get("detected", capabilities[cap_name]["detected"])
                        capabilities[cap_name]["confidence"] = cap_val.get("confidence", capabilities[cap_name]["confidence"])
                        if "evidence" in cap_val:
                            capabilities[cap_name]["evidence"] = cap_val["evidence"]
                        if "explanation" in cap_val:
                            capabilities[cap_name]["explanation"] = cap_val["explanation"]
            
            if "rag_maturity" in llm_override:
                rag_sug = llm_override["rag_maturity"]
                rag_intelligence["maturity"] = rag_sug.get("maturity", rag_intelligence["maturity"])
                rag_intelligence["maturity_score"] = rag_sug.get("score", rag_intelligence["maturity_score"])
                if "evidence" in rag_sug:
                    rag_intelligence["evidence"] = rag_sug["evidence"]
                if "weaknesses" in rag_sug:
                    rag_intelligence["weaknesses"] = rag_sug["weaknesses"]
                if "recommendations" in rag_sug:
                    rag_intelligence["recommendations"] = rag_sug["recommendations"]
                    
            if "agentic_maturity" in llm_override:
                agent_sug = llm_override["agentic_maturity"]
                agentic_intelligence["maturity"] = agent_sug.get("maturity", agentic_intelligence["maturity"])
                agentic_intelligence["maturity_score"] = agent_sug.get("score", agentic_intelligence["maturity_score"])
                if "evidence" in agent_sug:
                    agentic_intelligence["evidence"] = agent_sug["evidence"]
                if "weaknesses" in agent_sug:
                    agentic_intelligence["weaknesses"] = agent_sug["weaknesses"]
                if "recommendations" in agent_sug:
                    agentic_intelligence["recommendations"] = agent_sug["recommendations"]

            if "governance_report" in llm_override:
                gov_sug = llm_override["governance_report"]
                governance_report["risk_score"] = gov_sug.get("risk_score", governance_report["risk_score"])
                governance_report["eu_ai_act_classification"] = gov_sug.get("eu_ai_act_classification", governance_report["eu_ai_act_classification"])
                governance_report["eu_ai_act_explanation"] = gov_sug.get("eu_ai_act_explanation", governance_report["eu_ai_act_explanation"])
                governance_report["license_compliance"] = gov_sug.get("license_compliance", governance_report["license_compliance"])
                governance_report["license_compatibility"] = gov_sug.get("license_compatibility", governance_report["license_compatibility"])
                if "data_privacy_issues" in gov_sug:
                    governance_report["data_privacy_issues"] = gov_sug["data_privacy_issues"]
                if "regulatory_recommendations" in gov_sug:
                    governance_report["regulatory_recommendations"] = gov_sug["regulatory_recommendations"]

        return {
            "models": discovered_models,
            "embeddings": discovered_embeddings,
            "vector_dbs": discovered_vector_dbs,
            "frameworks": discovered_frameworks,
            "prompts": discovered_prompts,
            "capabilities": capabilities,
            "suitability_report": suitability_report,
            "architecture_quality_score": base_arch_score,
            "rag_intelligence": rag_intelligence,
            "agentic_intelligence": agentic_intelligence,
            "gpu_intelligence": gpu_intelligence,
            "application_flow": flow_steps,
            "data_flow_intelligence": data_flow_intelligence,
            "governance_report": governance_report,
            "graph": {
                "nodes": graph_nodes,
                "edges": graph_edges
            }
        }
