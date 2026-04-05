# AI RAG Reader

A document Q&A application built with Next.js and TypeScript.
Upload a document and ask questions — answers are grounded in the document content using RAG.

## How it works
1. User uploads a document
2. Document is chunked and embedded
3. User asks a question
4. Relevant chunks are retrieved and passed to the LLM
5. LLM generates a grounded answer

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Google SDK with Gemini/ Anthropic 
- Tailwind CSS

## Getting Started
npm install
npm run dev
