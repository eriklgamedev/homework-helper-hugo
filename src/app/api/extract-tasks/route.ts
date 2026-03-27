import { generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const TaskSchema = z.object({
  tasks: z.array(
    z.object({
      text: z.string().describe("The homework task description"),
      subject: z
        .string()
        .optional()
        .describe("Subject like Math, Reading, Science etc."),
    })
  ),
});

export async function POST(req: Request) {
  const { image, lang } = await req.json();

  if (!image) {
    return Response.json({ error: "No image provided" }, { status: 400 });
  }

  const isChinese = lang === "zh";
  const prompt = isChinese
    ? `请仔细查看这张作业或任务清单的图片。提取每一个独立的任务或作业项目。对于每个任务，提供任务描述文字，以及可选的科目（数学、阅读、科学、写作、拼写、历史、美术、音乐等）。请尽量提取图片中所见的所有任务。如果是手写文字，请尽力辨认。请用中文输出。`
    : `Look at this image of a homework assignment or task list. Extract every individual task or assignment item. For each task, provide the text description and optionally the subject (Math, Reading, Science, Writing, Spelling, History, Art, Music, etc). Be thorough - extract ALL tasks visible in the image. If the text is handwritten, do your best to read it.`;

  const { output } = await generateText({
    model: openrouter("google/gemini-2.5-flash"),
    output: Output.object({ schema: TaskSchema }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          {
            type: "image",
            image,
          },
        ],
      },
    ],
  });

  return Response.json({ tasks: output?.tasks ?? [] });
}
