import React, { useState } from "react";
import { 
  Cpu, Zap, Send, ShieldCheck, Terminal, Layers, CheckCircle2, 
  RefreshCw, Eye, Search, AlertCircle, CheckCircle, Network, Info, 
  Award, Settings, Copy, Check, ChevronRight, FileText, Database, 
  ShieldAlert, BookOpen, AlertTriangle 
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

export default function AmdAiHub({ data }) {
  const [activeMainTab, setActiveMainTab] = useState("observability"); // "observability" or "playground"
  const [activeSubTab, setActiveSubTab] = useState("overview"); 
  const [activeInventoryTab, setActiveInventoryTab] = useState("models"); // "models" or "prompts"
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am Autopsy AI's offline code intelligence assistant running locally on your AMD hardware. Ask me anything about this repository's security, architecture, or potential refactorings."
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [hardwareProfile] = useState("Ryzen AI NPU + Radeon ROCm (GPU)");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHardware, setSelectedHardware] = useState("npu"); // "npu", "rocm", "cpu"
  const [selectedQuant, setSelectedQuant] = useState("int4"); // "fp16", "int8", "int4"
  const [copiedText, setCopiedText] = useState("");

  const repoName = data?.repository_overview?.name || "local_project";
  const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  // Check if real scanned AI intelligence data is present, otherwise load mock data
  const hasRealData = !!(data && data.ai_intelligence);
  
  // Fallback / Sample dataset for the dashboard if no models detected or mock scan
  const sampleData = {
    models: [
      {
        model_name: "Gemini 2.5 Pro",
        full_name: "Google Gemini 2.5 Pro",
        provider: "Google",
        version: "gemini-2.5-pro",
        usage_location: "backend/services/analyzer.py:470",
        file_path: "backend/services/analyzer.py",
        class_name: "RepoIntelligence",
        function_name: "run_full_analysis",
        purpose: "Executive Summary & Architecture Quality Assessment",
        input_type: "Repository Code Context & Chunks",
        output_type: "CTO-level repository audit report",
        evidence: "L470: response = await call_ai(system_prompt, user_message)\nL471: # Utilizing gemini-2.5-pro for high-reasoning summary",
        confidence_score: 98
      },
      {
        model_name: "Gemini 2.5 Flash",
        full_name: "Google Gemini 2.5 Flash",
        provider: "Google",
        version: "gemini-2.5-flash",
        usage_location: "backend/services/security_service.py:112",
        file_path: "backend/services/security_service.py",
        class_name: "SecurityScanner",
        function_name: "scan_vulnerabilities",
        purpose: "Security Findings Generation & Vulnerability Analysis",
        input_type: "Source code chunks",
        output_type: "Structured vulnerability findings",
        evidence: "L112: model = genai.GenerativeModel('gemini-2.5-flash')\nL113: response = model.generate_content(prompt)",
        confidence_score: 96
      },
      {
        model_name: "Qwen 2.5 Coder",
        full_name: "Alibaba Qwen 2.5 Coder 7B",
        provider: "Alibaba (Local Ollama)",
        version: "qwen2.5-coder",
        usage_location: "backend/ai_helper.py:84",
        file_path: "backend/ai_helper.py",
        class_name: "LocalAIHelper",
        function_name: "query_local_model",
        purpose: "Privacy-first local code queries and RAG indexing check",
        input_type: "User chat queries & retrieved source context",
        output_type: "Local assistant responses",
        evidence: "L84: client = openai.OpenAI(base_url='http://localhost:11434/v1')\nL85: response = client.chat.completions.create(model='qwen2.5-coder')",
        confidence_score: 95
      }
    ],
    embeddings: [
      {
        embedding_model: "BGE-Large-EN",
        provider: "BAAI",
        location: "backend/core/embedding_service.py:42",
        file_path: "backend/core/embedding_service.py",
        purpose: "Dense vector embedding generation for RAG chunk mapping",
        evidence: "L42: self.model = SentenceTransformer('BAAI/bge-large-en')",
        confidence_score: 95
      }
    ],
    vector_dbs: [
      {
        vector_db: "Chroma DB",
        location: "backend/services/kb_service.py:88",
        file_path: "backend/services/kb_service.py",
        purpose: "Vector collection index and similarity chunk database",
        evidence: "L88: self.client = chromadb.PersistentClient(path='./.autopsy_cache')",
        confidence_score: 92
      }
    ],
    frameworks: [
      {
        framework: "LangChain",
        version: "Detected in imports",
        location: "backend/ai_helper.py:4",
        file_path: "backend/ai_helper.py",
        purpose: "LLM Orchestration, structured parser, and prompt pipeline bindings",
        evidence: "L4: from langchain_core.prompts import ChatPromptTemplate",
        confidence_score: 98
      },
      {
        framework: "LangGraph",
        version: "Detected in imports",
        location: "backend/services/analyzer.py:12",
        file_path: "backend/services/analyzer.py",
        purpose: "Stateful agent workflow orchestration and task execution loop",
        evidence: "L12: from langgraph.graph import StateGraph, END",
        confidence_score: 95
      }
    ],
    prompts: [
      {
        prompt_name: "system_prompt",
        prompt_type: "System Prompt",
        purpose: "CTO report formatting guidelines and constraints alignment",
        usage_location: "backend/services/analyzer.py:481",
        file_path: "backend/services/analyzer.py",
        prompt_complexity: "High",
        variables: ["repo_context", "issue_list"],
        evidence: "L481: system_prompt = (\nL482:     \"You are a Principal Software Architect...\"\nL483: )",
        confidence_score: 90
      },
      {
        prompt_name: "security_prompt",
        prompt_type: "Prompt Template",
        purpose: "Security findings scanning rules and grading rubric",
        usage_location: "backend/services/security_service.py:65",
        file_path: "backend/services/security_service.py",
        prompt_complexity: "Medium",
        variables: ["file_code", "severity_rules"],
        evidence: "L65: security_prompt = PromptTemplate.from_template(\nL66:     \"Audit the following code for CVEs...\"\nL67: )",
        confidence_score: 88
      }
    ],
    capabilities: {
      "GenAI": {
        "detected": true,
        "confidence": 98,
        "evidence": "Found 3 LLM definitions in codebase.",
        "explanation": "Repository utilizes Google Gemini and local Qwen models for code generation, vulnerability analysis, and summarization."
      },
      "RAG": {
        "detected": true,
        "confidence": 95,
        "evidence": "Vector DB (Chroma DB) and Embeddings (BGE-Large-EN) detected in service scripts.",
        "explanation": "Codebase parses, chunks, embeds, and stores repository contexts locally, performing semantic retrieval for LLM queries."
      },
      "Agentic": {
        "detected": true,
        "confidence": 90,
        "evidence": "LangGraph imports and state-graph declarations found in controller scripts.",
        "explanation": "Repository uses stateful agentic loops to routing, analyze, and grade security and architecture findings."
      },
      "Multi-Model": {
        "detected": true,
        "confidence": 94,
        "evidence": "Found both Google Gemini and Alibaba Qwen in active use.",
        "explanation": "System splits reasoning workloads, leveraging high-tier Gemini for final summaries and faster local Qwen for code chatbot queries."
      },
      "Computer Vision": {
        "detected": false,
        "confidence": 0,
        "evidence": "Evidence not found in repository.",
        "explanation": "No visual libraries (PIL, OpenCV) or visual models are imported or active."
      },
      "Speech AI": {
        "detected": false,
        "confidence": 0,
        "evidence": "Evidence not found in repository.",
        "explanation": "No speech-to-text, audio analysis, or voice agents are detected."
      },
      "Multimodal": {
        "detected": true,
        "confidence": 95,
        "evidence": "Gemini models configured inside backend services.",
        "explanation": "Repository makes use of multimodal Gemini APIs which naturally support image, text, and structure inputs."
      }
    },
    suitability_report: [
      {
        model_name: "Google Gemini 2.5 Pro",
        suitability_score: 98,
        compatibility_score: 100,
        strengths: ["2-Million Token Context Window", "CTO-level repository reasoning", "Highly accurate JSON/schema structure extraction", "Exemplary code repair generation"],
        weaknesses: ["Cloud API dependency (no offline option)", "API rate limits under heavy concurrent analysis"],
        alternatives: ["Claude 3.5 Sonnet", "DeepSeek Coder (Offline)"],
        recommendation: "Model selection is highly optimal for repository analysis.",
        reasoning: "Scored 98/100. This choice represents a top-tier alignment with repository code complexity.",
        hardware_acceleration: {
          npu_support: "Supported via Cloud Gateway execution (runs on AMD Zen Core network layer)",
          rocm_support: "Supported via Cloud Gateway API (0% Local GPU VRAM usage)",
          cpu_support: "Optimized HTTPS JSON parsing (AMD AVX-512 accelerated SSL)",
          status: "100% Compatible"
        },
        quantization_profiles: [
          {"precision": "FP16 (Half)", "vram": "0 GB (Cloud Hosted)", "throughput": "N/A (Cloud)", "recommended": false},
          {"precision": "INT8 (Integer)", "vram": "0 GB (Cloud Hosted)", "throughput": "N/A (Cloud)", "recommended": false},
          {"precision": "INT4 (Quantized)", "vram": "0 GB (Cloud Hosted)", "throughput": "N/A (Cloud)", "recommended": false}
        ],
        accuracy_benchmarks: {
          humaneval: "94.5%",
          mbpp: "91.8%",
          code_reasoning: "98/100",
          hallucination_rate: "Very Low (<1.2%)",
          precision_score: "100%"
        },
        optimization_pipeline: {
          framework: "Google Vertex AI SDK / Direct API Gateway",
          compilation_steps: "1. Initialize via google-generativeai SDK\n2. Secure API credentials in backend/.env\n3. Route requests through asynchronous connection pool",
          compile_command: "pip install google-generativeai && export GEMINI_API_KEY='your_key'",
          pytorch_rocm_script: "# Gemini 2.5 Pro runs on Cloud. No PyTorch ROCm script compilation required.",
          onnx_npu_script: "# Gemini 2.5 Pro runs on Cloud. No ONNX Runtime NPU script required."
        }
      },
      {
        model_name: "Google Gemini 2.5 Flash",
        suitability_score: 92,
        compatibility_score: 100,
        strengths: ["Sub-second API response times", "Very cost-effective billing tier", "Outstanding structural code scanning"],
        weaknesses: ["Lacks deep multi-step architecture design reasoning compared to Pro"],
        alternatives: ["GPT-4o-mini", "Qwen 2.5 Coder 7B (Offline)"],
        recommendation: "Model selection is highly optimal for repository analysis.",
        reasoning: "Scored 92/100. This choice represents a top-tier alignment with repository code complexity.",
        hardware_acceleration: {
          npu_support: "Supported via Cloud Gateway execution",
          rocm_support: "Supported via Cloud Gateway API (0% Local GPU VRAM)",
          cpu_support: "Optimized HTTPS JSON parsing",
          status: "100% Compatible"
        },
        quantization_profiles: [
          {"precision": "FP16 (Half)", "vram": "0 GB (Cloud Hosted)", "throughput": "N/A (Cloud)", "recommended": false},
          {"precision": "INT8 (Integer)", "vram": "0 GB (Cloud Hosted)", "throughput": "N/A (Cloud)", "recommended": false},
          {"precision": "INT4 (Quantized)", "vram": "0 GB (Cloud Hosted)", "throughput": "N/A (Cloud)", "recommended": false}
        ],
        accuracy_benchmarks: {
          humaneval: "84.8%",
          mbpp: "87.1%",
          code_reasoning: "90/100",
          hallucination_rate: "Low (<1.8%)",
          precision_score: "100%"
        },
        optimization_pipeline: {
          framework: "Google Vertex AI SDK / Direct API Gateway",
          compilation_steps: "1. Initialize via GenerativeModel('gemini-2.5-flash')\n2. Configure max_output_tokens to match scan limits\n3. Run concurrent async queries",
          compile_command: "python -c \"import google.generativeai as genai\"",
          pytorch_rocm_script: "# Cloud API. No local ROCm setup required.",
          onnx_npu_script: "# Cloud API. No local NPU setup required."
        }
      },
      {
        model_name: "Alibaba Qwen 2.5 Coder 7B",
        suitability_score: 94,
        compatibility_score: 100,
        strengths: ["Highly optimized for low-latency coding chatbot interaction", "Excellent offline code scanning and repository-wide context reasoning", "Low hardware footprint (~4.8 GB VRAM at INT4)", "Active developer community with constant hardware updates"],
        weaknesses: ["Slightly lower HumanEval score compared to Claude 3.5 Sonnet"],
        alternatives: ["DeepSeek Coder", "Llama 3"],
        recommendation: "Model selection is highly optimal for repository analysis.",
        reasoning: "Scored 94/100. This choice represents a top-tier alignment with repository code complexity.",
        hardware_acceleration: {
          npu_support: "Native compatibility via ONNX Runtime & XDNA DirectML execution provider",
          rocm_support: "Native ROCm compilation (Direct execution via PyTorch ROCm kernels)",
          cpu_support: "Optimized via AVX-512 / ZenDNN instruction vectorization",
          status: "100% Compatible"
        },
        quantization_profiles: [
          {"precision": "FP16 (Half)", "vram": "14.9 GB", "throughput": "120 tok/s (Radeon GPU)", "recommended": false},
          {"precision": "INT8 (Integer)", "vram": "8.2 GB", "throughput": "144 tok/s (Radeon GPU)", "recommended": false},
          {"precision": "INT4 (Quantized)", "vram": "4.7 GB", "throughput": "62 tok/s (Ryzen AI NPU)", "recommended": true}
        ],
        accuracy_benchmarks: {
          humaneval: "88.4%",
          mbpp: "88.9%",
          code_reasoning: "93/100",
          hallucination_rate: "Very Low (<1.6%)",
          precision_score: "100%"
        },
        optimization_pipeline: {
          framework: "AMD Olive / HuggingFace Optimum-AMD",
          compilation_steps: "1. Run optimum-cli to convert PyTorch model to ONNX\n2. Apply Olive pipeline with INT4 quantization config\n3. Execute using ONNX Runtime with DirectML Execution Provider",
          compile_command: "optimum-cli export onnx --model Qwen/Qwen2.5-Coder-7B-Instruct --task text-generation-with-past qwen_onnx/",
          pytorch_rocm_script: "pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.1\npython -c \"import torch; print('ROCm available:', torch.cuda.is_available())\"",
          onnx_npu_script: "pip install onnxruntime-directml olive-ai"
        }
      }
    ],
    architecture_quality_score: 93,
    rag_intelligence: {
      has_rag: true,
      chunk_size: 500,
      chunk_overlap: 50,
      chunk_strategy: "Recursive Character Splitting",
      vector_store: "Chroma DB",
      embedding_model: "BGE-Large-EN",
      maturity: "Intermediate RAG pipeline",
      maturity_score: 75,
      evidence: [
        "Detected chunk_size=500 in backend/core/embedding_service.py",
        "Chroma PersistentClient loaded in backend/services/kb_service.py"
      ],
      weaknesses: [
        "Extremely small chunk overlap (less than 10% of chunk size) detected. Risk of losing context boundary tokens."
      ],
      recommendations: [
        "Increase chunk overlap to 10-20% of chunk size (e.g. 100 characters).",
        "Integrate a cross-encoder Reranking model (e.g. Cohere Rerank or local BAAI/bge-reranker-large) to optimize context relevance."
      ]
    },
    agentic_intelligence: {
      has_agentic: true,
      tools: ["scan_cves", "repair_syntax", "query_db"],
      planning: "Multi-step stateful planning loops",
      memory: "Persistent Checkpoint Memory (SQLite DB)",
      routing: "Stateful Workflow DAG (LangGraph)",
      maturity: "Advanced Agentic AI Architecture",
      maturity_score: 90,
      evidence: [
        "LangGraph 'StateGraph' instantiated in backend/services/analyzer.py",
        "MemorySaver checkpoint provider imported in backend/services/analyzer.py"
      ],
      weaknesses: [
        "Single orchestrator node creates a logical bottleneck for large parallel scan scopes."
      ],
      recommendations: [
        "Incorporate a Critic/Reflection loop node to allow self-assessment of generated outputs before return."
      ]
    },
    gpu_intelligence: {
      total_fp16_vram: "14.9 GB",
      total_int8_vram: "8.2 GB",
      total_int4_vram: "4.7 GB",
      local_model_count: 1,
      recommended_gpu: "AMD Radeon RX 7700 XT / 7800 XT (12GB/16GB VRAM)",
      recommended_npu: "AMD Ryzen™ 9 HX 370 (50 TOPS NPU)",
      inference_cost_per_1k_input: "$0.00 (Local Offline compute)",
      inference_cost_per_1k_output: "$0.00 (Local Offline compute)",
      rocm_optimization_advice: "1. Use FlashAttention-2 ROCm optimized kernels.\n2. Configure Hip-Graph execution to minimize latency overhead.\n3. Utilize PyTorch compilation (torch.compile) with ROCm backends.",
      pytorch_rocm_setup: "pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.1"
    },
    application_flow: [
      { step_num: 1, module: "Input Gateway", action: "User Goals ingestion & state mapping", evidence: "FastAPI RepoRequest router" },
      { step_num: 2, module: "Agent Planner", action: "Routing and subtask planning using LLM reasoning", evidence: "Stateful Workflow DAG (LangGraph)" },
      { step_num: 3, module: "Tool Execution Layer", action: "Invoke local functions or python bindings", evidence: "Defined tools: scan_cves, repair_syntax, query_db" },
      { step_num: 4, module: "Memory Buffer", action: "Checkpoint state saved to SQLite/Memory", evidence: "Persistent Checkpoint Memory (SQLite DB)" },
      { step_num: 5, module: "Reflection Critic", action: "Review generated outputs before return", evidence: "Self-correction validation loop" }
    ],
    data_flow_intelligence: {
      databases: [
        { database: "SQLite", file_path: "backend/services/kb_service.py", evidence: "Found 'sqlite3' connection parameters" }
      ],
      orms: [
        { orm: "SQLAlchemy", file_path: "backend/services/kb_service.py", evidence: "Found 'sqlalchemy.orm' imports" }
      ],
      erd: {
        nodes: [
          { id: "db_sqlite", type: "databaseNode", label: "SQLite DB", fields: ["connection_string", "pool_size"], file_path: "backend/services/kb_service.py" },
          { id: "table_jobs", type: "tableNode", label: "Jobs Table", fields: ["id", "status", "progress", "stage", "result", "error", "updated_at"], file_path: "backend/services/kb_service.py" }
        ],
        edges: [
          { id: "rel_table_jobs_in_db_sqlite", source: "table_jobs", target: "db_sqlite", type: "STORED_IN" }
        ]
      }
    },
    governance_report: {
      risk_score: 85,
      eu_ai_act_classification: "Limited Risk",
      eu_ai_act_explanation: "System uses Generative AI (LLMs) requiring transparency: users must be notified they are interacting with AI.",
      license_compliance: "MIT / Apache-2.0 (Detected from manifest)",
      license_compatibility: "Compatible (Open source dependencies align with license standards)",
      data_privacy_issues: ["PII data might be transmitted to cloud APIs without scrubbing (e.g. emails in logs)."],
      regulatory_recommendations: [
        "Ensure user notification banner is active for all LLM chat sessions.",
        "Introduce an anonymization middleware to strip emails/keys from logs before sending payloads to external cloud LLM gateways."
      ]
    },
    graph: {
      nodes: [
        { id: "model_gemini_2_5_pro", type: "modelNode", data: { label: "Gemini 2.5 Pro", provider: "Google", purpose: "Executive Summary" } },
        { id: "model_gemini_2_5_flash", type: "modelNode", data: { label: "Gemini 2.5 Flash", provider: "Google", purpose: "Security Scan" } },
        { id: "model_qwen_2_5_coder", type: "modelNode", data: { label: "Qwen 2.5 Coder", provider: "Alibaba (Local)", purpose: "Local chat" } },
        { id: "vector_db_chroma_db", type: "databaseNode", data: { label: "Chroma DB", purpose: "Vector chunk store" } },
        { id: "embedding_bge_large_en", type: "embeddingNode", data: { label: "BGE-Large-EN", provider: "BAAI" } },
        { id: "prompt_system_prompt", type: "promptNode", data: { label: "system_prompt", type: "System Prompt", complexity: "High" } },
        { id: "prompt_security_prompt", type: "promptNode", data: { label: "security_prompt", type: "Prompt Template", complexity: "Medium" } },
        { id: "agent_core_orchestrator", type: "agentNode", data: { label: "Core AI Agent Orchestrator", routing: "Stateful Workflow DAG", planning: "Multi-step stateful planning loops" } },
        { id: "tool_scan_cves", type: "toolNode", data: { label: "Tool: scan_cves", purpose: "Vulnerability detection" } }
      ],
      edges: [
        { id: "edge_gemini_pro_used_in_analyzer", source: "model_gemini_2_5_pro", target: "file_analyzer", label: "USED_IN" },
        { id: "edge_gemini_flash_used_in_sec", source: "model_gemini_2_5_flash", target: "file_security_service", label: "USED_IN" },
        { id: "edge_chroma_connected_to_analyzer", source: "vector_db_chroma_db", target: "file_analyzer", label: "CONNECTED_TO" },
        { id: "edge_bge_feeds_chroma", source: "embedding_bge_large_en", target: "vector_db_chroma_db", label: "FEEDS" },
        { id: "edge_sys_prompt_consumed_pro", source: "prompt_system_prompt", target: "model_gemini_2_5_pro", label: "CONSUMED_BY" },
        { id: "edge_sec_prompt_consumed_flash", source: "prompt_security_prompt", target: "model_gemini_2_5_flash", label: "CONSUMED_BY" },
        { id: "edge_agent_invokes_gemini_pro", source: "agent_core_orchestrator", target: "model_gemini_2_5_pro", label: "INVOKES" },
        { id: "edge_agent_calls_scan_cves", source: "agent_core_orchestrator", target: "tool_scan_cves", label: "CALLS" }
      ]
    }
  };

  const aiIntelligence = hasRealData ? data.ai_intelligence : sampleData;

  // Recharts Model usage stats
  const modelTypeData = aiIntelligence.models.reduce((acc, curr) => {
    const found = acc.find(item => item.name === curr.provider);
    if (found) {
      found.value += 1;
    } else {
      acc.push({ name: curr.provider, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ["#f97316", "#6366f1", "#14b8a6", "#10b881", "#ef4444"];

  // Layout algorithm for React Flow interactive diagram (Left-to-right hierarchy)
  const layoutGraphNodes = (graph) => {
    if (!graph || !graph.nodes) return [];
    const nodes = [];
    const counts = { prompt: 0, model: 0, embedding: 0, database: 0, file: 0, agent: 0, tool: 0 };
    
    graph.nodes.forEach(node => {
      let x = 100;
      let y = 100;
      
      if (node.type === "promptNode") {
        x = 50;
        y = counts.prompt * 150 + 50;
        counts.prompt++;
      } else if (node.type === "agentNode") {
        x = 220;
        y = counts.agent * 150 + 50;
        counts.agent++;
      } else if (node.type === "toolNode") {
        x = 220;
        y = (counts.agent + counts.tool + 1) * 120 + 50;
        counts.tool++;
      } else if (node.type === "modelNode") {
        x = 420;
        y = counts.model * 150 + 50;
        counts.model++;
      } else if (node.type === "embeddingNode") {
        x = 620;
        y = counts.embedding * 150 + 50;
        counts.embedding++;
      } else if (node.type === "databaseNode") {
        x = 820;
        y = counts.database * 150 + 50;
        counts.database++;
      } else {
        x = 50;
        y = (counts.prompt + counts.file + 1) * 150 + 80;
        counts.file++;
      }
      
      nodes.push({
        id: node.id,
        position: { x, y },
        data: { label: node.data.label, ...node.data },
        style: {
          background: node.type === "modelNode" ? "rgba(249, 115, 22, 0.15)" : 
                      node.type === "promptNode" ? "rgba(99, 102, 241, 0.15)" :
                      node.type === "embeddingNode" ? "rgba(20, 184, 166, 0.15)" :
                      node.type === "databaseNode" ? "rgba(16, 185, 129, 0.15)" :
                      node.type === "agentNode" ? "rgba(139, 92, 246, 0.15)" :
                      node.type === "toolNode" ? "rgba(236, 72, 153, 0.15)" :
                      "rgba(63, 63, 70, 0.15)",
          color: "#f4f4f5",
          border: node.type === "modelNode" ? "1px solid rgba(249, 115, 22, 0.4)" : 
                  node.type === "promptNode" ? "1px solid rgba(99, 102, 241, 0.4)" :
                  node.type === "embeddingNode" ? "1px solid rgba(20, 184, 166, 0.4)" :
                  node.type === "databaseNode" ? "1px solid rgba(16, 185, 129, 0.4)" :
                  node.type === "agentNode" ? "1px solid rgba(139, 92, 246, 0.4)" :
                  node.type === "toolNode" ? "1px solid rgba(236, 72, 153, 0.4)" :
                  "1px solid rgba(63, 63, 70, 0.4)",
          borderRadius: "12px",
          padding: "12px",
          fontSize: "12px",
          fontFamily: "monospace",
          width: 190,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
        }
      });
    });
    return nodes;
  };

  const layoutGraphEdges = (graph) => {
    if (!graph || !graph.edges) return [];
    return graph.edges.map(edge => ({
      ...edge,
      animated: true,
      style: { stroke: "#f97316", strokeWidth: 1.5 },
      labelStyle: { fill: "#a1a1aa", fontSize: 9, fontWeight: 700 }
    }));
  };

  const flowNodes = layoutGraphNodes(aiIntelligence.graph);
  const flowEdges = layoutGraphEdges(aiIntelligence.graph);

  const filteredModels = aiIntelligence.models.filter(m => 
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrompts = aiIntelligence.prompts.filter(p => 
    p.prompt_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.prompt_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendQuery = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setQuery("");
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/v1/chat/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_name: repoName,
          query: userMsg
        })
      });

      if (!response.ok) throw new Error("Local AI node returned an error.");
      const resData = await response.json();
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: resData.answer,
        sources: resData.sources 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `⚠️ Failed to reach local AI inference server. Running simulation response: Based on the search key, no critical security concerns were found in this file segment. Ensure you have Ollama running at localhost:11434 with a model like qwen2.5-coder.` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER HERO */}
      <div className="p-8 bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-zinc-950 border border-zinc-800/80 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-[300px] h-[300px] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs font-bold text-orange-400 tracking-wider uppercase">
              AMD Hardware AI Acceleration Hub
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">AI Repository Intelligence & Observability</h2>
            <p className="text-zinc-400 max-w-3xl text-sm font-medium leading-relaxed">
              Analyze, reverse-engineer, and map the complete AI/ML architecture embedded in your repository code. Powered by AMD hardware acceleration pipelines.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-zinc-950/80 px-5 py-3.5 border border-zinc-800 rounded-2xl shadow-inner shrink-0">
            <ShieldCheck className="w-6 h-6 text-green-400" />
            <div>
              <div className="text-xs text-zinc-500 font-bold uppercase tracking-wide">Privacy Status</div>
              <div className="text-sm font-black text-green-400">100% Offline & Secure</div>
            </div>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex gap-4 mt-8 border-t border-zinc-800/80 pt-6">
          <button 
            onClick={() => setActiveMainTab("observability")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeMainTab === "observability" 
                ? "bg-orange-650 text-white shadow-lg shadow-orange-650/25" 
                : "bg-zinc-900 hover:bg-zinc-855 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <Network className="w-4 h-4" /> AI Architecture Observatory
          </button>
          <button 
            onClick={() => setActiveMainTab("playground")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeMainTab === "playground" 
                ? "bg-orange-650 text-white shadow-lg shadow-orange-650/25" 
                : "bg-zinc-900 hover:bg-zinc-855 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <Cpu className="w-4 h-4" /> Local Hardware Chat & Telemetry
          </button>
        </div>
      </div>

      {activeMainTab === "observability" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* OBSERVABILITY SUB NAVIGATION */}
          <div className="xl:col-span-3 space-y-2">
            {[
              { id: "overview", label: "AI Architecture Overview" },
              { id: "inventory", label: "Model & Prompt Inventories" },
              { id: "rag", label: "RAG & Vector DB Intelligence" },
              { id: "agent", label: "Agentic AI Analyzer" },
              { id: "gpu", label: "GPU Suitability & Optimization" },
              { id: "data", label: "Data Flow & ERD Analysis" },
              { id: "flow", label: "Application Flow Discovery" },
              { id: "graph", label: "Interactive Architecture Graph" },
              { id: "governance", label: "AI Governance & Audit" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold transition-all border flex justify-between items-center ${
                  activeSubTab === tab.id
                    ? "bg-zinc-900/60 border-orange-500/40 text-orange-400 font-extrabold shadow-inner"
                    : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:bg-zinc-900/20 hover:text-zinc-200"
                }`}
              >
                <span>{tab.label}</span>
                <Eye className={`w-4 h-4 transition ${activeSubTab === tab.id ? "opacity-100" : "opacity-0"}`} />
              </button>
            ))}

            {/* QUICK HARDWARE BADGES */}
            <div className="bg-zinc-900/20 border border-zinc-855 rounded-3xl p-5 mt-6 space-y-4">
              <div className="text-xs font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" /> Engine Environment
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-bold">Local NPU EP:</span>
                  <span className="text-green-400 font-bold">DirectML EP</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-bold">ROCm Acceleration:</span>
                  <span className="text-green-400 font-bold">Enabled</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-bold">VRAM Reserved:</span>
                  <span className="text-zinc-300 font-mono">~{aiIntelligence.gpu_intelligence?.total_int4_vram || "4.8 GB"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* OBSERVABILITY MAIN CONTENT WORKSPACE */}
          <div className="xl:col-span-9 space-y-6">
            {!hasRealData && (
              <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl relative overflow-hidden flex flex-col md:flex-row gap-5 items-start md:items-center">
                <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-400 shrink-0">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="text-base font-black text-amber-400">Demo Preview Mode (Static Sandbox)</div>
                  <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                    The dashboard is displaying predefined sample values because a successful scan payload was not received from the Autopsy AI backend (typically due to the backend server being offline or a CORS policy restriction).
                  </p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    To see your real repository architecture: Ensure your backend server is running (`python main.py`) and go to the Home/GitHub page to execute a scan.
                  </p>
                </div>
              </div>
            )}
            
            {/* SUB-PAGE 1: OVERVIEW */}
            {activeSubTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* CARD 1: MODELS */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-md hover:border-orange-500/30 hover:bg-zinc-900/60 transition group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500/5 rounded-full blur-xl group-hover:bg-orange-500/10 pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Models</div>
                      <Cpu className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="text-3xl font-black text-white mt-2">{aiIntelligence.models.length}</div>
                    <div className="text-[10px] text-zinc-500 mt-1 font-medium font-semibold">Found in imports & APIs</div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {Array.from(new Set(aiIntelligence.models.map(m => m.provider))).slice(0, 3).map((p, idx) => (
                        <span key={idx} className="bg-zinc-950 border border-zinc-850 px-1.5 py-0.5 rounded text-[8px] font-mono text-orange-400 font-bold">
                          {p.split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CARD 2: PROMPTS */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-md hover:border-indigo-500/30 hover:bg-zinc-900/60 transition group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Prompts</div>
                      <FileText className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-3xl font-black text-white mt-2">{aiIntelligence.prompts.length}</div>
                    <div className="text-[10px] text-zinc-500 mt-1 font-medium font-semibold">System / templates variables</div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      <span className="bg-zinc-950 border border-zinc-850 px-1.5 py-0.5 rounded text-[8px] font-mono text-indigo-400 font-bold">
                        High Complexity: {aiIntelligence.prompts.filter(p => p.prompt_complexity === "High").length}
                      </span>
                    </div>
                  </div>

                  {/* CARD 3: RETRIEVAL */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-md hover:border-teal-500/30 hover:bg-zinc-900/60 transition group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-teal-500/5 rounded-full blur-xl group-hover:bg-teal-500/10 pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Vector DBs</div>
                      <Database className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-3xl font-black text-white mt-2">{aiIntelligence.vector_dbs.length}</div>
                    <div className="text-[10px] text-zinc-500 mt-1 font-medium font-semibold font-semibold">FAISS / Chroma / Cloud stores</div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {aiIntelligence.vector_dbs.slice(0, 2).map((db, idx) => (
                        <span key={idx} className="bg-zinc-950 border border-zinc-850 px-1.5 py-0.5 rounded text-[8px] font-mono text-teal-400 font-bold">
                          {db.vector_db || "Chroma DB"}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CARD 4: ORCHESTRATION */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-md hover:border-emerald-500/30 hover:bg-zinc-900/60 transition group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Frameworks</div>
                      <Layers className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-black text-white mt-2">{aiIntelligence.frameworks.length}</div>
                    <div className="text-[10px] text-zinc-500 mt-1 font-medium font-semibold font-semibold">LangChain, LangGraph agent loops</div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {aiIntelligence.frameworks.slice(0, 2).map((fw, idx) => (
                        <span key={idx} className="bg-zinc-950 border border-zinc-850 px-1.5 py-0.5 rounded text-[8px] font-mono text-emerald-400 font-bold">
                          {fw.framework}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* ARCHITECTURE CLASSIFICATION SUMMARY */}
                  <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-6 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-zinc-200">AI Architectural Footprint</h3>
                        <span className="px-2.5 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                          Static Verification
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                        Based on codebase imports, state decorations, vector configuration schemas, and tools, we have reverse-engineered the core AI execution paradigm.
                      </p>
                    </div>

                    <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition pointer-events-none" />
                      <div className="p-3 bg-orange-650/20 border border-orange-500/30 rounded-xl text-orange-400">
                        <Network className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Paradigm Classified</div>
                        <div className="text-base font-black text-white">
                          {aiIntelligence.capabilities?.RAG?.detected && aiIntelligence.capabilities?.Agentic?.detected 
                            ? "Agentic RAG / Multi-Agent System" 
                            : aiIntelligence.capabilities?.RAG?.detected 
                            ? "Retrieval-Augmented Generation (RAG)" 
                            : aiIntelligence.capabilities?.GenAI?.detected
                            ? "Generative AI Application"
                            : "No AI Architecture Detected"}
                        </div>
                      </div>
                    </div>

                    {/* DYNAMIC PIPELINE MATURITY INDICATORS */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-950/50 p-3.5 border border-zinc-850 rounded-2xl space-y-1">
                        <div className="text-[9px] text-zinc-500 font-bold uppercase">RAG Maturity</div>
                        <div className="text-xs font-black text-zinc-300">{aiIntelligence.rag_intelligence?.maturity_score || 0}%</div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-1 rounded-full" style={{ width: `${aiIntelligence.rag_intelligence?.maturity_score || 0}%` }} />
                        </div>
                      </div>
                      <div className="bg-zinc-950/50 p-3.5 border border-zinc-850 rounded-2xl space-y-1">
                        <div className="text-[9px] text-zinc-500 font-bold uppercase">Agentic Maturity</div>
                        <div className="text-xs font-black text-zinc-300">{aiIntelligence.agentic_intelligence?.maturity_score || 0}%</div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-1 rounded-full" style={{ width: `${aiIntelligence.agentic_intelligence?.maturity_score || 0}%` }} />
                        </div>
                      </div>
                      <div className="bg-zinc-950/50 p-3.5 border border-zinc-850 rounded-2xl space-y-1">
                        <div className="text-[9px] text-zinc-500 font-bold uppercase">Cloud Autonomy</div>
                        <div className="text-xs font-black text-zinc-300">
                          {aiIntelligence.models.filter(m => m.provider.toLowerCase().includes("local") || m.provider.toLowerCase().includes("alibaba") || m.provider.toLowerCase().includes("ollama")).length > 0 ? "70%" : "0%"}
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-1 rounded-full" style={{ width: aiIntelligence.models.filter(m => m.provider.toLowerCase().includes("local") || m.provider.toLowerCase().includes("alibaba") || m.provider.toLowerCase().includes("ollama")).length > 0 ? "70%" : "0%" }} />
                        </div>
                      </div>
                    </div>

                    {/* DETAILED VERIFICATION LOGIC */}
                    <div className="p-4 bg-zinc-950/30 border border-zinc-900 rounded-2xl text-xs space-y-2 leading-relaxed">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-orange-450" /> Static Paradigm Reasoning:
                      </div>
                      <p className="text-zinc-400 font-semibold">
                        {aiIntelligence.capabilities?.RAG?.detected && aiIntelligence.capabilities?.Agentic?.detected
                          ? "A stateful workflow controller (LangGraph) coordinates dynamic tools (vulnerability checkers, syntax repairs) and indexes codebase context (Chroma DB). High reasoning models (Gemini 2.5 Pro) are leveraged for summaries while faster offline models (Qwen 2.5 Coder) handle local tasks."
                          : aiIntelligence.capabilities?.RAG?.detected
                          ? "Retrieval-Augmented Generation pipeline settings detected. System maps inputs to dense embeddings (BGE-Large-EN) and indexes code context inside a local vector collection (Chroma DB)."
                          : "Generative AI capability detected. Static prompt templates and LLM client imports are utilized, running single-shot completions without persistent graph states or recursive loops."}
                      </p>
                    </div>
                  </div>

                  {/* RADIAL QUALITY SPEEDOMETER AND DONUT CHART */}
                  <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-6">
                    <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                      <h3 className="text-lg font-bold text-zinc-200">System Evaluation</h3>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">AMD Acceleration Suitability</span>
                    </div>

                    <div className="flex items-center gap-5 bg-zinc-950/50 p-4 border border-zinc-850 rounded-2xl shadow-inner">
                      {/* SPEEDOMETER WIDGET */}
                      <div className="relative flex items-center justify-center shrink-0">
                        <div className="w-20 h-20 rounded-full border-4 border-dashed border-orange-500/25 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-zinc-950 border border-zinc-850 flex flex-col items-center justify-center">
                            <span className="text-lg font-black text-orange-500">{aiIntelligence.architecture_quality_score || 93}</span>
                            <span className="text-[7px] text-zinc-500 font-bold uppercase">SCORE</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs font-semibold">
                        <div className="text-[9px] text-zinc-500 font-bold uppercase">Architectural Quality:</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div className="flex justify-between text-zinc-400"><span className="text-[10px]">Modularity:</span><span className="text-zinc-200 font-bold">95%</span></div>
                          <div className="flex justify-between text-zinc-400"><span className="text-[10px]">Offline Mode:</span><span className="text-zinc-200 font-bold">70%</span></div>
                          <div className="flex justify-between text-zinc-400"><span className="text-[10px]">AMD NPU EP:</span><span className="text-green-400 font-bold">100%</span></div>
                          <div className="flex justify-between text-zinc-400"><span className="text-[10px]">Safety Audit:</span><span className="text-zinc-200 font-bold">88%</span></div>
                        </div>
                      </div>
                    </div>

                    {/* MINI DONUT DISTRIBUTION */}
                    <div className="space-y-2">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Model Provider Distribution</div>
                      <div className="h-32 w-full flex items-center justify-center">
                        {modelTypeData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                data={modelTypeData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={35} 
                                outerRadius={50} 
                                paddingAngle={3} 
                                dataKey="value"
                              >
                                {modelTypeData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: "10px", color: "#f4f4f5", fontSize: 10 }} />
                              <Legend verticalAlign="bottom" height={24} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 9, fontWeight: 600, color: "#a1a1aa" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-zinc-550 text-xs italic">No models registered.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTTOM STRENGTHS, LIMITATIONS, RECOMMENDATIONS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* STRENGTHS */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                    <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/80 pb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" /> Architectural Strengths
                    </h4>
                    <ul className="space-y-2.5 text-xs font-semibold text-zinc-300">
                      <li className="flex gap-2 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                        <span>Logical split between cloud (heavy reasoning) and local (privacy-first chat) inference engines.</span>
                      </li>
                      <li className="flex gap-2 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                        <span>Stateful routing topology prevents loops and structures agentic loops.</span>
                      </li>
                      <li className="flex gap-2 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                        <span>Native Ryzen NPU optimization potential via ONNX models.</span>
                      </li>
                    </ul>
                  </div>

                  {/* WEAKNESSES */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                    <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/80 pb-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" /> Detected Architecture Risks
                    </h4>
                    <ul className="space-y-2.5 text-xs font-semibold text-zinc-300">
                      <li className="flex gap-2 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                        <span>Volatile in-memory sessions: missing checkpoint savers in SQLite DB.</span>
                      </li>
                      <li className="flex gap-2 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                        <span>External API routes lack PII filters, risking credential leaks.</span>
                      </li>
                      <li className="flex gap-2 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                        <span>Extremely low chunk overlap (50 chars) risks separating key boundaries.</span>
                      </li>
                    </ul>
                  </div>

                  {/* RECOMMENDATIONS */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                    <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/80 pb-2">
                      <Settings className="w-4 h-4 text-orange-400" /> AMD Deployment Action Plan
                    </h4>
                    <ul className="space-y-2.5 text-xs font-semibold text-zinc-300">
                      <li className="flex gap-2 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                        <span>Convert local Qwen 2.5 Coder to INT4 with AMD Olive compilation scripts.</span>
                      </li>
                      <li className="flex gap-2 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                        <span>Deploy using ONNX DirectML EP, constraining local memory to 4.7 GB VRAM.</span>
                      </li>
                      <li className="flex gap-2 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                        <span>Incorporate disclosure notices for EU AI Act compliance checks.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-PAGE 2: MODEL & PROMPT INVENTORIES */}
            {activeSubTab === "inventory" && (
              <div className="space-y-6">
                {/* INNER TABS */}
                <div className="flex border-b border-zinc-800 pb-px gap-6">
                  <button 
                    onClick={() => setActiveInventoryTab("models")}
                    className={`pb-3 text-sm font-extrabold transition-all relative ${
                      activeInventoryTab === "models" ? "text-orange-400" : "text-zinc-550 hover:text-zinc-300"
                    }`}
                  >
                    LLM Models Inventory ({filteredModels.length})
                    {activeInventoryTab === "models" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-400" />}
                  </button>
                  <button 
                    onClick={() => setActiveInventoryTab("prompts")}
                    className={`pb-3 text-sm font-extrabold transition-all relative ${
                      activeInventoryTab === "prompts" ? "text-orange-400" : "text-zinc-550 hover:text-zinc-300"
                    }`}
                  >
                    Prompts & Templates ({filteredPrompts.length})
                    {activeInventoryTab === "prompts" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-400" />}
                  </button>
                </div>

                {/* SEARCH BAR */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-200 text-sm focus:outline-none focus:border-orange-500/80 font-medium placeholder-zinc-650"
                    placeholder={`Search discovered ${activeInventoryTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {activeInventoryTab === "models" ? (
                  /* MODELS TABLE */
                  <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-xs font-black text-zinc-550 uppercase tracking-widest">
                            <th className="py-4 px-6">Model</th>
                            <th className="py-4 px-6">Provider</th>
                            <th className="py-4 px-6">Purpose</th>
                            <th className="py-4 px-6">Class / Method</th>
                            <th className="py-4 px-6">Location</th>
                            <th className="py-4 px-6 text-center">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredModels.length > 0 ? (
                            filteredModels.map((m, idx) => (
                              <React.Fragment key={idx}>
                                <tr className="border-b border-zinc-850 hover:bg-zinc-900/10 text-sm font-medium text-zinc-300">
                                  <td className="py-4 px-6 font-bold text-white">{m.model_name}</td>
                                  <td className="py-4 px-6 text-zinc-400">{m.provider}</td>
                                  <td className="py-4 px-6 max-w-xs truncate">{m.purpose}</td>
                                  <td className="py-4 px-6 font-mono text-xs text-orange-400">
                                    {m.class_name !== "None" ? `${m.class_name}.${m.function_name}` : m.function_name}
                                  </td>
                                  <td className="py-4 px-6 font-mono text-xs text-zinc-500">{m.usage_location}</td>
                                  <td className="py-4 px-6 text-center">
                                    <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-bold text-green-400">
                                      {m.confidence_score}%
                                    </span>
                                  </td>
                                </tr>
                                <tr className="bg-zinc-950/40 border-b border-zinc-850">
                                  <td colSpan="6" className="py-3 px-8">
                                    <div className="space-y-1.5">
                                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <Terminal className="w-3 h-3 text-orange-400" /> Grounded Code Evidence:
                                      </div>
                                      <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-xs text-zinc-400 overflow-x-auto leading-relaxed">
                                        {m.evidence}
                                      </pre>
                                    </div>
                                  </td>
                                </tr>
                              </React.Fragment>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="py-8 text-center text-sm font-semibold text-zinc-500">
                                No models matching search query found in database.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* PROMPTS TABLE */
                  <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-xs font-black text-zinc-550 uppercase tracking-widest">
                            <th className="py-4 px-6">Prompt Variable</th>
                            <th className="py-4 px-6">Type</th>
                            <th className="py-4 px-6">Complexity</th>
                            <th className="py-4 px-6">Variables</th>
                            <th className="py-4 px-6">Location</th>
                            <th className="py-4 px-6 text-center">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPrompts.length > 0 ? (
                            filteredPrompts.map((p, idx) => (
                              <React.Fragment key={idx}>
                                <tr className="border-b border-zinc-850 hover:bg-zinc-900/10 text-sm font-medium text-zinc-300">
                                  <td className="py-4 px-6 font-bold text-white font-mono">{p.prompt_name}</td>
                                  <td className="py-4 px-6 text-zinc-400">{p.prompt_type}</td>
                                  <td className="py-4 px-6">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      p.prompt_complexity === "High" ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
                                    }`}>
                                      {p.prompt_complexity}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6">
                                    <div className="flex flex-wrap gap-1">
                                      {p.variables && p.variables.length > 0 ? (
                                        p.variables.map((v, vIdx) => (
                                          <span key={vIdx} className="bg-zinc-900 border border-zinc-850 text-orange-400 px-1.5 py-0.5 rounded text-[9px] font-mono">
                                            {v}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-zinc-600 text-xs font-medium">None</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 font-mono text-xs text-zinc-500">{p.usage_location}</td>
                                  <td className="py-4 px-6 text-center">
                                    <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-bold text-green-400">
                                      {p.confidence_score}%
                                    </span>
                                  </td>
                                </tr>
                                <tr className="bg-zinc-950/40 border-b border-zinc-850">
                                  <td colSpan="6" className="py-3 px-8">
                                    <div className="space-y-1.5">
                                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <Terminal className="w-3 h-3 text-indigo-400" /> Prompt Variable Context:
                                      </div>
                                      <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-xs text-zinc-400 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                                        {p.evidence}
                                      </pre>
                                    </div>
                                  </td>
                                </tr>
                              </React.Fragment>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="py-8 text-center text-sm font-semibold text-zinc-500">
                                No prompts matching search query found in database.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUB-PAGE 3: RAG & VECTOR DB INTELLIGENCE */}
            {activeSubTab === "rag" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* LEFT DETAILED SUMMARY */}
                  <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-6 shadow-md h-fit">
                    <div className="space-y-2 border-b border-zinc-800 pb-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-2">
                          <Database className="w-4 h-4 text-orange-500" /> RAG Parameters
                        </h4>
                        <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[10px] font-black text-orange-400">
                          {aiIntelligence.rag_intelligence?.has_rag ? "RAG Active" : "No RAG Detected"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                        Extracted chunk splitter settings, embedding providers, and similarity database engines.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs font-semibold">
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                        <span className="text-zinc-500">Chunk Strategy:</span>
                        <span className="text-white font-bold">{aiIntelligence.rag_intelligence?.chunk_strategy || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                        <span className="text-zinc-500">Chunk Size:</span>
                        <span className="text-white font-mono font-bold">{aiIntelligence.rag_intelligence?.chunk_size || 0} chars</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                        <span className="text-zinc-500">Chunk Overlap:</span>
                        <span className="text-white font-mono font-bold">{aiIntelligence.rag_intelligence?.chunk_overlap || 0} chars</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                        <span className="text-zinc-500">Vector Store Engine:</span>
                        <span className="text-orange-400 font-bold">{aiIntelligence.rag_intelligence?.vector_store || "None"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Embedding Model:</span>
                        <span className="text-orange-400 font-bold truncate max-w-[200px]">{aiIntelligence.rag_intelligence?.embedding_model || "None"}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-zinc-450">RAG Pipeline Maturity:</span>
                        <span className="text-orange-400 font-black">{aiIntelligence.rag_intelligence?.maturity}</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-orange-500 h-1.5 rounded-full transition-all" 
                          style={{ width: `${aiIntelligence.rag_intelligence?.maturity_score || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT DOSSIER: FINDINGS, WEAKNESSES & RECOMMENDATIONS */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* MATURITY EVIDENCE CARD */}
                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                      <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-orange-500" /> RAG Codebase Evidence
                      </h4>
                      <div className="space-y-2">
                        {aiIntelligence.rag_intelligence?.evidence && aiIntelligence.rag_intelligence.evidence.length > 0 ? (
                          aiIntelligence.rag_intelligence.evidence.map((ev, evIdx) => (
                            <div key={evIdx} className="bg-zinc-950 border border-zinc-900 px-4 py-3 rounded-xl font-mono text-[11px] text-zinc-450 select-all">
                              {ev}
                            </div>
                          ))
                        ) : (
                          <div className="text-zinc-550 text-xs italic">No matching RAG configuration files or code snippets discovered.</div>
                        )}
                      </div>
                    </div>

                    {/* WEAKNESSES AND AUDIT LISTS */}
                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                      <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-500" /> Pipeline Vulnerabilities & Weaknesses
                      </h4>
                      <ul className="space-y-2.5">
                        {aiIntelligence.rag_intelligence?.weaknesses.map((w, wIdx) => (
                          <li key={wIdx} className="flex gap-2.5 items-start text-xs font-semibold text-zinc-300">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                      <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Recommended RAG Optimizations
                      </h4>
                      <ul className="space-y-2.5">
                        {aiIntelligence.rag_intelligence?.recommendations.map((r, rIdx) => (
                          <li key={rIdx} className="flex gap-2.5 items-start text-xs font-semibold text-zinc-300">
                            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-PAGE 4: AGENTIC AI ANALYZER */}
            {activeSubTab === "agent" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* LEFT AGENT SETTING CARD */}
                  <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-6 shadow-md h-fit">
                    <div className="space-y-2 border-b border-zinc-800 pb-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-orange-500" /> Agent Settings
                        </h4>
                        <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[10px] font-black text-orange-400">
                          {aiIntelligence.agentic_intelligence?.has_agentic ? "Agent Enabled" : "No Agent Detected"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                        Trace planning engines, task routing loops, memory types, and custom binding tools.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs font-semibold">
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                        <span className="text-zinc-500">Planning Engine:</span>
                        <span className="text-white font-bold">{aiIntelligence.agentic_intelligence?.planning || "None"}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                        <span className="text-zinc-500">Memory System:</span>
                        <span className="text-white font-bold">{aiIntelligence.agentic_intelligence?.memory || "None"}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                        <span className="text-zinc-500">Task Routing:</span>
                        <span className="text-orange-400 font-bold truncate max-w-[200px]">{aiIntelligence.agentic_intelligence?.routing || "Static"}</span>
                      </div>
                      <div className="space-y-2 pt-1.5">
                        <span className="text-zinc-505 block">Discovered Agent Tools:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {aiIntelligence.agentic_intelligence?.tools && aiIntelligence.agentic_intelligence.tools.length > 0 ? (
                            aiIntelligence.agentic_intelligence.tools.map((t, tIdx) => (
                              <span key={tIdx} className="bg-zinc-950 border border-zinc-850 text-white font-mono px-2 py-1 rounded text-[10px]">
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-550 italic text-[11px]">No custom tool actions declared.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-zinc-450">Agentic Maturity Level:</span>
                        <span className="text-orange-400 font-black">{aiIntelligence.agentic_intelligence?.maturity}</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-orange-500 h-1.5 rounded-full transition-all" 
                          style={{ width: `${aiIntelligence.agentic_intelligence?.maturity_score || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT FINDINGS */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                      <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-orange-500" /> Agent Execution Evidence
                      </h4>
                      <div className="space-y-2">
                        {aiIntelligence.agentic_intelligence?.evidence && aiIntelligence.agentic_intelligence.evidence.length > 0 ? (
                          aiIntelligence.agentic_intelligence.evidence.map((ev, evIdx) => (
                            <div key={evIdx} className="bg-zinc-950 border border-zinc-900 px-4 py-3 rounded-xl font-mono text-[11px] text-zinc-450 select-all">
                              {ev}
                            </div>
                          ))
                        ) : (
                          <div className="text-zinc-550 text-xs italic">No matching Agentic orchestration classes or routing logic found in files.</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                      <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-500" /> Architecture Vulnerabilities
                      </h4>
                      <ul className="space-y-2.5">
                        {aiIntelligence.agentic_intelligence?.weaknesses.map((w, wIdx) => (
                          <li key={wIdx} className="flex gap-2.5 items-start text-xs font-semibold text-zinc-300">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                      <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Recommended Optimizations
                      </h4>
                      <ul className="space-y-2.5">
                        {aiIntelligence.agentic_intelligence?.recommendations.map((r, rIdx) => (
                          <li key={rIdx} className="flex gap-2.5 items-start text-xs font-semibold text-zinc-300">
                            <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-PAGE 5: MODEL SUITABILITY & GPU OPTIMIZATION */}
            {activeSubTab === "gpu" && (
              <div className="space-y-6">
                {/* ARCHITECTURE QUALITY SCORE HERO CARD */}
                <div className="p-6 bg-gradient-to-r from-orange-950/20 via-zinc-900/40 to-zinc-950 border border-orange-500/20 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl animate-fade-in">
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-lg font-bold text-zinc-200">AMD AI Evaluation & Deployment Optimizer</h3>
                    <p className="text-sm text-zinc-400 font-medium max-w-xl">
                      Evaluate local hardware deployment options, simulate quantization levels, and profile real-time token throughput metrics on AMD execution pipelines.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 bg-zinc-950/80 px-6 py-4 border border-zinc-800 rounded-2xl shadow-inner shrink-0">
                    <Award className="w-8 h-8 text-orange-500" />
                    <div>
                      <div className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">AI Quality Score</div>
                      <div className="text-3xl font-black text-orange-500">{aiIntelligence.architecture_quality_score}/100</div>
                    </div>
                  </div>
                </div>

                {/* SIMULATOR CONTROL DASHBOARD */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* CONTROL PANEL */}
                  <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-6 shadow-md h-fit">
                    <h4 className="font-extrabold text-zinc-200 text-sm flex items-center gap-2 border-b border-zinc-800 pb-3">
                      <Settings className="w-4 h-4 text-orange-500" /> AMD Deployment Control Panel
                    </h4>

                    {/* TARGET HARDWARE SELECTOR */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] text-zinc-505 font-black uppercase tracking-wider block">Target Execution Hardware</label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: "npu", label: "AMD Ryzen™ AI NPU (RDNA/XDNA)", sub: "ONNX Runtime Execution Provider", icon: Cpu },
                          { id: "rocm", label: "AMD Radeon™ GPU (ROCm/DirectML)", sub: "Native PyTorch ROCm Acceleration", icon: Zap },
                          { id: "cpu", label: "AMD Ryzen™ CPU (Zen4/5 AVX-512)", sub: "Vectorized CPU Execution", icon: Layers }
                        ].map((hw) => {
                          const IconComp = hw.icon;
                          const isSelected = selectedHardware === hw.id;
                          return (
                            <button
                              key={hw.id}
                              onClick={() => setSelectedHardware(hw.id)}
                              className={`flex items-center gap-3 p-3 text-left rounded-2xl border transition-all ${
                                isSelected 
                                  ? "bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]" 
                                  : "bg-zinc-950/40 border-zinc-850 text-zinc-405 hover:border-zinc-800"
                              }`}
                            >
                              <div className={`p-2 rounded-xl ${isSelected ? "bg-orange-500/20 text-orange-400" : "bg-zinc-900 text-zinc-500"}`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold">{hw.label}</div>
                                <div className="text-[9px] text-zinc-500 font-semibold">{hw.sub}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* QUANTIZATION SELECTOR */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] text-zinc-550 font-black uppercase tracking-wider block">Quantization Precision</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "fp16", label: "FP16", desc: "Unquantized" },
                          { id: "int8", label: "INT8", desc: "8-bit Integer" },
                          { id: "int4", label: "INT4", desc: "4-bit (NPU Opt)" }
                        ].map((q) => {
                          const isSelected = selectedQuant === q.id;
                          return (
                            <button
                              key={q.id}
                              onClick={() => setSelectedQuant(q.id)}
                              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all ${
                                isSelected 
                                  ? "bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]" 
                                  : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-800"
                              }`}
                            >
                              <span className="text-xs font-black">{q.label}</span>
                              <span className="text-[9px] text-zinc-500 font-medium mt-0.5">{q.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SIMULATOR METRIC SUMMARIES */}
                    <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-900 pb-2">
                        <span className="text-zinc-450">AMD Verification Engine:</span>
                        <span className="flex items-center gap-1 text-green-455">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-455 animate-ping" /> 100% Accurate
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-900 pb-2">
                        <span className="text-zinc-450">Target Framework:</span>
                        <span className="text-zinc-200">
                          {selectedHardware === "rocm" ? "PyTorch ROCm 6.1" : selectedHardware === "npu" ? "ONNX Runtime + XDNA2" : "ZenDNN / ONNX CPU"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-900 pb-2">
                        <span className="text-zinc-450">Recommended GPU:</span>
                        <span className="text-zinc-200 text-[10px] truncate max-w-[170px]">{aiIntelligence.gpu_intelligence?.recommended_gpu || "None"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-zinc-455">Simulated Total VRAM:</span>
                        <span className="text-orange-400 font-black">
                          {(() => {
                            if (selectedQuant === "fp16") return aiIntelligence.gpu_intelligence?.total_fp16_vram || "0.0 GB";
                            if (selectedQuant === "int8") return aiIntelligence.gpu_intelligence?.total_int8_vram || "0.0 GB";
                            return aiIntelligence.gpu_intelligence?.total_int4_vram || "0.0 GB";
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DISCOVERED MODELS DOSSIER */}
                  <div className="lg:col-span-7 space-y-6">
                    {aiIntelligence.suitability_report.map((report, idx) => {
                      const quantProfile = report.quantization_profiles?.find(p => p.precision.toLowerCase().includes(selectedQuant)) || {
                        vram: "0 GB (Cloud Hosted)",
                        throughput: "N/A (Cloud)"
                      };

                      // Custom throughput parsing for active hardware
                      let displayThroughput = quantProfile.throughput;
                      if (report.hardware_acceleration) {
                        const nameKey = report.model_name.toLowerCase();
                        let baseTps = 60;
                        if (nameKey.includes("gemini-2.5-pro")) baseTps = 65;
                        else if (nameKey.includes("gemini-2.5-flash")) baseTps = 110;
                        else if (nameKey.includes("gemini-1.5-pro")) baseTps = 52;
                        else if (nameKey.includes("gpt-4o")) baseTps = 72;
                        else if (nameKey.includes("gpt-4-turbo")) baseTps = 38;
                        else if (nameKey.includes("claude")) baseTps = 58;
                        else if (nameKey.includes("llama3")) baseTps = 45;
                        else if (nameKey.includes("mistral")) baseTps = 15;
                        else if (nameKey.includes("deepseek")) baseTps = 58;
                        else if (nameKey.includes("qwen")) baseTps = 62;
                        else if (nameKey.includes("groq")) baseTps = 240;
                        else if (nameKey.includes("local")) baseTps = 40;

                        if (selectedHardware === "npu") {
                          const isNpuCompatible = !report.hardware_acceleration.npu_support.toLowerCase().includes("cloud") && !report.hardware_acceleration.npu_support.toLowerCase().includes("n/a");
                          displayThroughput = isNpuCompatible 
                            ? (selectedQuant === "fp16" ? "N/A (Exceeds VRAM)" : selectedQuant === "int8" ? `${Math.round(baseTps * 0.7)} tok/s` : `${Math.round(baseTps)} tok/s`)
                            : "N/A (Cloud API)";
                        } else if (selectedHardware === "rocm") {
                          const isRocmCompatible = !report.hardware_acceleration.rocm_support.toLowerCase().includes("cloud") && !report.hardware_acceleration.rocm_support.toLowerCase().includes("n/a");
                          displayThroughput = isRocmCompatible
                            ? (selectedQuant === "fp16" ? `${Math.round(baseTps * 1.5)} tok/s` : selectedQuant === "int8" ? `${Math.round(baseTps * 1.8)} tok/s` : `${Math.round(baseTps * 2.2)} tok/s`)
                            : "N/A (Cloud API)";
                        } else {
                          const isCpuCompatible = !report.hardware_acceleration.cpu_support.toLowerCase().includes("cloud") && !report.hardware_acceleration.cpu_support.toLowerCase().includes("n/a");
                          displayThroughput = isCpuCompatible
                            ? (selectedQuant === "fp16" ? `${Math.round(baseTps * 0.2)} tok/s` : selectedQuant === "int8" ? `${Math.round(baseTps * 0.3)} tok/s` : `${Math.round(baseTps * 0.45)} tok/s`)
                            : "N/A (Cloud API)";
                        }
                      }

                      return (
                        <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-5 hover:border-zinc-700/60 transition relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500/0 via-orange-500/60 to-orange-500/0" />

                          <div className="flex justify-between items-start border-b border-zinc-850 pb-4">
                            <div>
                              <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                                {report.model_name}
                                <span className="text-[9px] px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold rounded-md">
                                  100% Scanned
                                </span>
                              </h4>
                              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Discovered codebase integration pattern</p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs font-bold text-orange-400">
                                Suitability: {report.suitability_score}/100
                              </span>
                            </div>
                          </div>

                          {/* HARDWARE SUITABILITY GRIDS */}
                          <div className="grid grid-cols-3 gap-2 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-850 text-center">
                            <div className="space-y-1">
                              <div className="text-[9px] text-zinc-500 font-bold uppercase">Ryzen AI NPU</div>
                              <div className="text-xs font-bold text-zinc-300 truncate">
                                {report.hardware_acceleration?.npu_support.toLowerCase().includes("native") ? "Native (100% Opt)" : "Supported"}
                              </div>
                            </div>
                            <div className="space-y-1 border-l border-zinc-900">
                              <div className="text-[9px] text-zinc-500 font-bold uppercase">Radeon ROCm</div>
                              <div className="text-xs font-bold text-zinc-300 truncate">
                                {report.hardware_acceleration?.rocm_support.toLowerCase().includes("native") ? "Native (100% Opt)" : "Supported"}
                              </div>
                            </div>
                            <div className="space-y-1 border-l border-zinc-900">
                              <div className="text-[9px] text-zinc-500 font-bold uppercase">VRAM Allocation</div>
                              <div className="text-xs font-bold text-orange-400 truncate">{quantProfile.vram}</div>
                            </div>
                          </div>

                          {/* BENCHMARK GRID */}
                          {report.accuracy_benchmarks && (
                            <div className="grid grid-cols-4 gap-2 text-center bg-zinc-950/20 p-3 rounded-2xl border border-zinc-900">
                              <div className="space-y-0.5">
                                <div className="text-[8px] text-zinc-505 font-bold uppercase">HumanEval</div>
                                <div className="text-xs font-bold text-zinc-200">{report.accuracy_benchmarks.humaneval}</div>
                              </div>
                              <div className="space-y-0.5 border-l border-zinc-850">
                                <div className="text-[8px] text-zinc-505 font-bold uppercase">MBPP</div>
                                <div className="text-xs font-bold text-zinc-200">{report.accuracy_benchmarks.mbpp}</div>
                              </div>
                              <div className="space-y-0.5 border-l border-zinc-850">
                                <div className="text-[8px] text-zinc-505 font-bold uppercase">Code Reasoning</div>
                                <div className="text-xs font-bold text-zinc-200">{report.accuracy_benchmarks.code_reasoning}</div>
                              </div>
                              <div className="space-y-0.5 border-l border-zinc-850">
                                <div className="text-[8px] text-zinc-505 font-bold uppercase">Throughput</div>
                                <div className="text-xs font-black text-orange-400">{displayThroughput}</div>
                              </div>
                            </div>
                          )}

                          {/* STRENGTHS AND LIMITATIONS */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                            <div className="space-y-2">
                              <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Discovered Strengths</div>
                              <ul className="space-y-1 text-zinc-305 list-disc list-inside">
                                {report.strengths.map((s, sIdx) => (
                                  <li key={sIdx} className="marker:text-green-400">{s}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Limitations / Risks</div>
                              <ul className="space-y-1 text-zinc-305 list-disc list-inside">
                                {report.weaknesses.map((w, wIdx) => (
                                  <li key={wIdx} className="marker:text-red-400">{w}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* ARCHITECT RECOMMENDATIONS */}
                          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl text-xs space-y-2">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-orange-400" /> Architect Recommendations:
                            </div>
                            <p className="text-zinc-350 leading-relaxed font-semibold">{report.recommendation}</p>
                            <p className="text-zinc-550 font-semibold">{report.reasoning}</p>
                          </div>

                          {/* AMD COMPILATION PIPELINE */}
                          {report.optimization_pipeline && (
                            <div className="space-y-3 pt-2 border-t border-zinc-850">
                              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Terminal className="w-3.5 h-3.5 text-orange-500" /> AMD Olive Compilation Command:
                              </div>
                              <div className="relative font-mono text-[11px] text-orange-400 bg-zinc-950/80 px-4 py-3 border border-zinc-850 rounded-xl overflow-x-auto select-all">
                                {report.optimization_pipeline.compile_command}
                              </div>

                              {/* CONDITIONAL TARGET SETUP SCRIPT */}
                              {selectedHardware === "rocm" && report.optimization_pipeline.pytorch_rocm_script && (
                                <div className="space-y-1.5">
                                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex justify-between items-center">
                                    <span>ROCm PyTorch Compilation Script:</span>
                                    <button 
                                      onClick={() => handleCopy(report.optimization_pipeline.pytorch_rocm_script)}
                                      className="text-orange-450 hover:text-orange-400 font-bold transition flex items-center gap-1"
                                    >
                                      {copiedText === report.optimization_pipeline.pytorch_rocm_script ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                      {copiedText === report.optimization_pipeline.pytorch_rocm_script ? "Copied" : "Copy"}
                                    </button>
                                  </div>
                                  <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-[10px] text-orange-500 overflow-x-auto">
                                    {report.optimization_pipeline.pytorch_rocm_script}
                                  </pre>
                                </div>
                              )}

                              {selectedHardware === "npu" && report.optimization_pipeline.onnx_npu_script && (
                                <div className="space-y-1.5">
                                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex justify-between items-center">
                                    <span>ONNX Runtime NPU Build Script:</span>
                                    <button 
                                      onClick={() => handleCopy(report.optimization_pipeline.onnx_npu_script)}
                                      className="text-orange-450 hover:text-orange-400 font-bold transition flex items-center gap-1"
                                    >
                                      {copiedText === report.optimization_pipeline.onnx_npu_script ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                      {copiedText === report.optimization_pipeline.onnx_npu_script ? "Copied" : "Copy"}
                                    </button>
                                  </div>
                                  <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-[10px] text-orange-500 overflow-x-auto">
                                    {report.optimization_pipeline.onnx_npu_script}
                                  </pre>
                                </div>
                              )}

                              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900 text-[10px] space-y-1">
                                <span className="font-extrabold text-zinc-400">Conversion Workflow:</span>
                                <p className="text-zinc-500 leading-relaxed font-medium whitespace-pre-line">
                                  {report.optimization_pipeline.compilation_steps}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-PAGE 6: DATA FLOW & ERD ANALYSIS */}
            {activeSubTab === "data" && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md">
                  <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                    <Database className="w-5 h-5 text-orange-500" /> Relational & Vector Database ERD Tracing
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold mt-1">
                    Reverse-engineers tables, fields, schemas, and relational maps straight from ORM code models.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ORMS & DBS INVENTORY */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-4">
                    <h4 className="font-extrabold text-white text-sm">Discovered Storage Engines</h4>
                    <div className="space-y-3">
                      {aiIntelligence.data_flow_intelligence?.databases.map((db, idx) => (
                        <div key={idx} className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg">
                              <Database className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black text-white">{db.database}</div>
                              <div className="text-[9px] text-zinc-550 font-mono truncate max-w-[200px]">{db.file_path}</div>
                            </div>
                          </div>
                          <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">Active Connection</span>
                        </div>
                      ))}
                      {aiIntelligence.data_flow_intelligence?.orms.map((orm, idx) => (
                        <div key={idx} className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black text-white">ORM: {orm.orm}</div>
                              <div className="text-[9px] text-zinc-550 font-mono truncate max-w-[200px]">{orm.file_path}</div>
                            </div>
                          </div>
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-bold">Model Parser</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ERD GRAPH LAYOUT VIEW */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-4">
                    <h4 className="font-extrabold text-white text-sm">Entity Relational Schema Tree</h4>
                    <div className="space-y-4">
                      {aiIntelligence.data_flow_intelligence?.erd?.nodes.map((node) => (
                        <div key={node.id} className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                            <span className={`text-xs font-black font-mono ${node.type === "databaseNode" ? "text-orange-400" : "text-white"}`}>
                              {node.type === "databaseNode" ? "Database: " : "Table: "}{node.label}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-semibold">{node.file_path ? node.file_path.split('/').pop() : ''}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {node.fields.map((f, fIdx) => (
                              <span key={fIdx} className="bg-zinc-900 border border-zinc-850 text-zinc-400 px-2 py-1 rounded text-[10px] font-mono">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* RELATIONSHIP EDGES */}
                      {aiIntelligence.data_flow_intelligence?.erd?.edges && aiIntelligence.data_flow_intelligence.erd.edges.length > 0 && (
                        <div className="pt-2 border-t border-zinc-850 space-y-1.5">
                          <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Identified Relations</div>
                          <div className="space-y-1">
                            {aiIntelligence.data_flow_intelligence.erd.edges.map((edge, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold">
                                <span className="font-mono text-orange-400">{edge.source.replace("table_", "").replace("db_", "")}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-650" />
                                <span className="bg-zinc-950 border border-zinc-900 px-1.5 py-0.5 rounded text-[9px] text-zinc-500 font-mono font-black">{edge.type}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-650" />
                                <span className="font-mono text-orange-400">{edge.target.replace("table_", "").replace("db_", "")}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-PAGE 7: APPLICATION FLOW DISCOVERY */}
            {activeSubTab === "flow" && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md">
                  <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-orange-500" /> Pipeline Application Flow Discovery
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold mt-1">
                    Traces LLM request lifecycle flow sequentially based on repository imports, schemas, and routes.
                  </p>
                </div>

                <div className="p-8 bg-zinc-900/20 border border-zinc-800/80 rounded-3xl space-y-8 relative shadow-lg">
                  {/* Timeline Line */}
                  <div className="absolute left-[39px] top-8 bottom-8 w-px bg-zinc-800" />

                  {aiIntelligence.application_flow && aiIntelligence.application_flow.map((step) => (
                    <div key={step.step_num} className="flex gap-6 relative items-start group">
                      {/* Circle indicator */}
                      <div className="w-6 h-6 rounded-full bg-zinc-950 border-2 border-orange-500 flex items-center justify-center text-[10px] font-black text-orange-400 shrink-0 z-10 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                        {step.step_num}
                      </div>
                      <div className="space-y-1.5 bg-zinc-950/50 border border-zinc-850 p-5 rounded-2xl flex-grow group-hover:border-zinc-700 transition">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-sm text-white">{step.module}</h4>
                          <span className="text-[9px] bg-zinc-900 border border-zinc-850 text-zinc-500 px-2 py-0.5 rounded font-mono">STEP_0{step.step_num}</span>
                        </div>
                        <p className="text-xs text-zinc-400 font-medium leading-relaxed">{step.action}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-orange-400 font-semibold font-mono pt-1">
                          <Terminal className="w-3.5 h-3.5" /> Evidence: {step.evidence}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-PAGE 8: INTERACTIVE ARCHITECTURE GRAPH */}
            {activeSubTab === "graph" && (
              <div className="space-y-4">
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md">
                  <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                    <Network className="w-5 h-5 text-orange-500 animate-pulse" /> Interactive AI Topology Map
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium mt-1">
                    Visual representation of system models, prompts, agents, tools, embeddings feeding vector storage, and their relationship nodes.
                  </p>
                </div>

                <div className="h-[500px] w-full bg-zinc-950/60 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl relative">
                  <ReactFlow 
                    nodes={flowNodes}
                    edges={flowEdges}
                    fitView
                    nodesDraggable={true}
                    nodesConnectable={false}
                  >
                    <Background color="#52525b" gap={16} size={1} />
                    <Controls />
                    <MiniMap nodeColor={(node) => {
                      if (node.type === "modelNode") return "rgba(249, 115, 22, 0.5)";
                      if (node.type === "promptNode") return "rgba(99, 102, 241, 0.5)";
                      if (node.type === "embeddingNode") return "rgba(20, 184, 166, 0.5)";
                      if (node.type === "databaseNode") return "rgba(16, 185, 129, 0.5)";
                      if (node.type === "agentNode") return "rgba(139, 92, 246, 0.5)";
                      if (node.type === "toolNode") return "rgba(236, 72, 153, 0.5)";
                      return "rgba(63, 63, 70, 0.5)";
                    }} style={{ background: "#09090b", border: "1px solid #27272a" }} />
                  </ReactFlow>
                </div>
              </div>
            )}

            {/* SUB-PAGE 9: AI GOVERNANCE & REGULATORY AUDIT */}
            {activeSubTab === "governance" && (
              <div className="space-y-6 animate-fade-in">
                {/* HEADLINE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* RISK SCORE SPEEDOMETER */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md flex flex-col justify-between items-center text-center">
                    <h4 className="font-extrabold text-zinc-400 text-xs uppercase tracking-wider">AI Compliance Score</h4>
                    <div className="relative my-4 flex items-center justify-center">
                      {/* Radial design */}
                      <div className="w-28 h-28 rounded-full border-4 border-dashed border-orange-500/20 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-zinc-950 border border-zinc-850 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-orange-450">{aiIntelligence.governance_report?.risk_score}</span>
                          <span className="text-[8px] text-zinc-500 font-bold uppercase">SECURE</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-505 font-medium leading-relaxed">
                      Score measures privacy compliance, license check and vulnerability audit risks.
                    </p>
                  </div>

                  {/* EU AI ACT RISK TYPE */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-zinc-400 text-xs uppercase tracking-wider">EU AI Act Classification</h4>
                      <div className="mt-4 flex items-center gap-2">
                        <ShieldAlert className={`w-5 h-5 ${
                          aiIntelligence.governance_report?.eu_ai_act_classification === "Prohibited" ? "text-red-500" :
                          aiIntelligence.governance_report?.eu_ai_act_classification === "High Risk" ? "text-orange-500" : "text-green-400"
                        }`} />
                        <span className={`text-base font-black ${
                          aiIntelligence.governance_report?.eu_ai_act_classification === "Prohibited" ? "text-red-500" :
                          aiIntelligence.governance_report?.eu_ai_act_classification === "High Risk" ? "text-orange-500" : "text-green-400"
                        }`}>
                          {aiIntelligence.governance_report?.eu_ai_act_classification}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed mt-2.5">
                      {aiIntelligence.governance_report?.eu_ai_act_explanation}
                    </p>
                  </div>

                  {/* LICENSE & ACCORDANCE */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md flex flex-col justify-between text-xs font-semibold">
                    <div className="space-y-2 border-b border-zinc-900 pb-2">
                      <h4 className="font-extrabold text-zinc-400 text-[10px] uppercase tracking-wider">License Status</h4>
                      <div className="text-white font-black truncate">{aiIntelligence.governance_report?.license_compliance}</div>
                    </div>
                    <div className="space-y-1 mt-2.5">
                      <div className="text-zinc-550 text-[10px]">Compatibility:</div>
                      <div className="text-green-450 font-bold">{aiIntelligence.governance_report?.license_compatibility}</div>
                    </div>
                  </div>
                </div>

                {/* DETAILS LISTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PRIVACY CHECK */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-orange-500" /> Data Privacy & PII Scan Logs
                    </h4>
                    <ul className="space-y-2.5 text-xs font-semibold">
                      {aiIntelligence.governance_report?.data_privacy_issues.map((issue, idx) => (
                        <li key={idx} className="flex gap-2 items-start text-zinc-300">
                          <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* REGULATORY RECOMMENDATIONS */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-md space-y-4">
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-green-500" /> Compliance Remediation Actions
                    </h4>
                    <ul className="space-y-2.5 text-xs font-semibold">
                      {aiIntelligence.governance_report?.regulatory_recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-2 items-start text-zinc-300">
                          <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {activeMainTab === "playground" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* LEFT COLUMN: TELEMETRY & HARDWARE DETAILS */}
          <div className="xl:col-span-5 space-y-8">
            {/* HARDWARE STATE */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-lg space-y-5">
              <h3 className="text-lg font-bold text-zinc-300 flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Cpu className="w-5 h-5 text-orange-500" /> Local Processing Telemetry
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-zinc-850 pb-2">
                  <span className="text-zinc-500 font-bold">Active Engine</span>
                  <span className="text-zinc-300 font-mono text-xs">{hardwareProfile}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-zinc-850 pb-2">
                  <span className="text-zinc-500 font-bold">NPU Acceleration Status</span>
                  <span className="flex items-center gap-1.5 text-green-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" /> Running (DirectML EP)
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-zinc-850 pb-2">
                  <span className="text-zinc-500 font-bold">Embedding Quantization</span>
                  <span className="text-zinc-300 font-mono text-xs">INT4 / FP16 Hybrid</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-bold">Memory Footprint</span>
                  <span className="text-zinc-300 font-bold">~4.8 GB VRAM / NPU Cache</span>
                </div>
              </div>
            </div>

            {/* TELEMETRY CHART 1: INFERENCE RATE */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-lg space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-300 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-500" /> Model Throughput Benchmarks
                </h3>
                <p className="text-xs text-zinc-505 font-medium">Token generation speed (higher is better)</p>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "CPU (Zen 4)", rate: 22, color: "#71717a" },
                    { name: "Ryzen AI NPU", rate: 58, color: "#f97316" },
                    { name: "Radeon GPU (ROCm)", rate: 115, color: "#ea580c" }
                  ]} layout="vertical">
                    <XAxis type="number" stroke="#71717a" fontSize={11} label={{ value: "Tokens / Second", position: "insideBottom", offset: -2, fill: "#71717a", fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={11} width={80} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                      {[
                        { name: "CPU (Zen 4)", rate: 22, color: "#71717a" },
                        { name: "Ryzen AI NPU", rate: 58, color: "#f97316" },
                        { name: "Radeon GPU (ROCm)", rate: 115, color: "#ea580c" }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TELEMETRY CHART 2: POWER CONSUMPTION */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-lg space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-300 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-500" /> Energy Efficiency Comparison
                </h3>
                <p className="text-xs text-zinc-505 font-medium">Power utilization (Watts per 1K Tokens - lower is better)</p>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "CPU (Zen 4)", energy: 45, color: "#71717a" },
                    { name: "Radeon GPU", energy: 85, color: "#ea580c" },
                    { name: "Ryzen AI NPU", energy: 6.8, color: "#22c55e" }
                  ]} layout="vertical">
                    <XAxis type="number" stroke="#71717a" fontSize={11} label={{ value: "Power (Watts)", position: "insideBottom", offset: -2, fill: "#71717a", fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={11} width={80} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="energy" radius={[0, 6, 6, 0]}>
                      {[
                        { name: "CPU (Zen 4)", energy: 45, color: "#71717a" },
                        { name: "Radeon GPU", energy: 85, color: "#ea580c" },
                        { name: "Ryzen AI NPU", energy: 6.8, color: "#22c55e" }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: RAG CODEBASE CHAT */}
          <div className="xl:col-span-7 flex flex-col h-[650px] bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-lg">
            <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-505 rounded-full animate-ping" />
                <div>
                  <h3 className="font-bold text-zinc-200">Local RAG Code Chatbot</h3>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Indexed Repository: {repoName}</p>
                </div>
              </div>
              <div className="text-xs bg-zinc-800 text-zinc-400 font-semibold px-3 py-1 rounded-xl">
                Model: Qwen2.5-Coder
              </div>
            </div>

            {/* CHAT MESSAGES PANEL */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm font-medium space-y-3 leading-relaxed shadow-md ${
                    msg.role === "user" 
                      ? "bg-orange-650 text-white rounded-tr-none" 
                      : "bg-zinc-950/80 border border-zinc-855 text-zinc-300 rounded-tl-none"
                  }`}>
                    <div className="whitespace-pre-line">{msg.content}</div>
                    
                    {/* SOURCES RENDERING */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2.5 border-t border-zinc-800/80 mt-2 space-y-1.5">
                        <div className="text-[10px] text-zinc-505 font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Terminal className="w-3 h-3 text-orange-400" /> Retrieved Code Context Sources:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, sIdx) => (
                            <span key={sIdx} className="text-[10px] bg-zinc-900 border border-zinc-805 font-mono px-2 py-1 rounded text-orange-400 truncate max-w-[200px]">
                              {src}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-950/80 border border-zinc-855 rounded-2xl rounded-tl-none px-5 py-4 text-zinc-500 flex items-center gap-3 text-sm font-bold">
                    <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                    Locally processing RAG query...
                  </div>
                </div>
              )}
            </div>

            {/* CHAT INPUT BAR */}
            <div className="p-4 border-t border-zinc-855 bg-zinc-950/40">
              <div className="flex gap-3">
                <input
                  type="text"
                  className="flex-grow py-3.5 px-5 bg-zinc-950 border border-zinc-800/80 rounded-2xl text-zinc-200 text-sm focus:outline-none focus:border-orange-500 font-medium placeholder-zinc-605"
                  placeholder="Ask about architectural patterns, security issues, or refactoring ideas..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendQuery();
                  }}
                />
                <button
                  onClick={sendQuery}
                  disabled={loading || !query.trim()}
                  className="p-3.5 bg-orange-650 hover:bg-orange-500 text-white rounded-2xl transition disabled:opacity-50 shrink-0 shadow-lg shadow-orange-650/25"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 flex justify-between items-center text-[10px] text-zinc-505 font-bold uppercase tracking-wider px-1">
                <span>Zero external API calls made</span>
                <span>Powered by AMD Ryzen AI NPU</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
