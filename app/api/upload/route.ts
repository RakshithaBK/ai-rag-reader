import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { embedMany } from 'ai';
import { voyage } from 'voyage-ai-provider';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { extractText, getDocumentProxy } from 'unpdf';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 1. Extract text from PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text: rawText } = await extractText(pdf, { mergePages: true });

    // 2. Split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const texts = await splitter.splitText(rawText);

    // 3. Embed with Gemini
    const { embeddings } = await embedMany({
      model: voyage.textEmbeddingModel('voyage-3'),
      values: texts,
    });

    // 4. Upsert into Pinecone
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pc.index(process.env.PINECONE_INDEX_NAME!);

    const vectors = embeddings.map((embedding, i) => ({
      id: `chunk-${Date.now()}-${i}`,
      values: embedding,
      metadata: { text: texts[i] },
    }));

    await index.upsert({ records: vectors });

    return NextResponse.json({
      success: true,
      message: `Successfully embedded ${vectors.length} chunks!`,
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to process PDF', details: message }, { status: 500 });
  }
}