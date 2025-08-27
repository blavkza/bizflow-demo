// app/api/ai/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

// Initialize Google Generative AI
const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// System instruction for task generation
const systemInstruction = `
You are a project management assistant that helps create detailed tasks with subtasks.
Generate tasks based on the user's input. Always respond with a valid JSON array of tasks.

Each task should have:
- title: A clear, concise title
- description: Detailed description of the task
- status: Either "TODO", "IN_PROGRESS", or "REVIEW"
- priority: Either "LOW", "MEDIUM", or "HIGH"
- estimatedHours: Estimated time to complete in hours (number)
- subtasks: An array of 3-5 subtasks, each with:
  - title: Subtask title
  - description: Subtask description
  - estimatedHours: Estimated time in hours

Format your response as:
[
  {
    "title": "Task title",
    "description": "Task description",
    "status": "TODO",
    "priority": "MEDIUM",
    "estimatedHours": 8,
    "subtasks": [
      {
        "title": "Subtask 1",
        "description": "Subtask description",
        "estimatedHours": 2
      },
      ...
    ]
  },
  ...
]
`;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, projectId, count = 3 } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Start chat session
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{ text: systemInstruction }],
        },
      ],
    });

    // Generate tasks using AI
    const aiPrompt = `
    Create ${count} detailed tasks for a project based on: "${prompt}".
    The project is about: ${project.title}.
    ${project.description ? `Project description: ${project.description}` : ""}
    
    Available team roles: ${project.team.employees.map((e) => e.role).join(", ")}.
    
    Generate realistic tasks with appropriate subtasks.
    `;

    const result = await chatSession.sendMessage(aiPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response
    let generatedTasks;
    try {
      // Extract JSON from response (AI might add markdown formatting)
      const jsonMatch =
        text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch
        ? jsonMatch[0].replace(/```json\n|```/g, "")
        : text;
      generatedTasks = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", text);
      return NextResponse.json(
        { error: "Failed to parse AI response", rawResponse: text },
        { status: 500 }
      );
    }

    // Validate the generated tasks structure
    if (!Array.isArray(generatedTasks)) {
      return NextResponse.json(
        { error: "AI response is not an array", response: generatedTasks },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tasks: generatedTasks,
      message: "Tasks generated successfully",
    });
  } catch (error) {
    console.error("[AI_TASK_GENERATION_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
