import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

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

const systemInstruction = `
You are a project management assistant that helps create detailed tasks with subtasks.
Generate tasks based on the user's input. Always respond with a valid JSON array of tasks.

Each task should have:
- title: A clear, concise title
- description: Detailed description of the task with all neccesary information
- status: Either "TODO" 
- priority: Either "LOW", "MEDIUM", "HIGH", 'URGENT'
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

    const { prompt, projectId } = await req.json();

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
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            estimatedHours: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{ text: systemInstruction }],
        },
      ],
    });

    const count = Math.floor(Math.random() * (7 - 3 + 1)) + 3;

    // Prepare existing tasks information for the AI
    const existingTasksInfo =
      project.tasks.length > 0
        ? `Existing tasks in this project: ${JSON.stringify(
            project.tasks.map((task) => ({
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
            }))
          )}`
        : "There are no existing tasks in this project yet.";

    const aiPrompt = `
    Create ${count} detailed tasks for a project based on: "${prompt}".
    The project is about: ${project.title}.
    ${project.description ? `Project description: ${project.description}` : ""}
    
    Available team roles: ${project.teamMembers.map((e) => e.role).join(", ")}.
    
    ${existingTasksInfo}
    
    IMPORTANT: Before generating new tasks, review the existing tasks above and avoid creating duplicate tasks.
    Generate unique, complementary tasks that don't overlap with existing ones.
    Focus on areas that haven't been covered yet.
    
    Generate realistic tasks with appropriate subtasks.
    `;

    const result = await chatSession.sendMessage(aiPrompt);
    const response = await result.response;
    const text = response.text();

    let generatedTasks;
    try {
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

    if (!Array.isArray(generatedTasks)) {
      return NextResponse.json(
        { error: "AI response is not an array", response: generatedTasks },
        { status: 500 }
      );
    }

    // Filter out tasks that might be duplicates of existing ones
    const uniqueGeneratedTasks = generatedTasks.filter((generatedTask) => {
      return !project.tasks.some(
        (existingTask) =>
          existingTask.title
            .toLowerCase()
            .includes(generatedTask.title.toLowerCase()) ||
          generatedTask.title
            .toLowerCase()
            .includes(existingTask.title.toLowerCase())
      );
    });

    if (uniqueGeneratedTasks.length === 0) {
      return NextResponse.json(
        {
          error:
            "All generated tasks appear to be duplicates of existing tasks. Please provide a more specific prompt.",
          existingTasks: project.tasks,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      tasks: uniqueGeneratedTasks,
      message: "Tasks generated successfully",
      totalGenerated: generatedTasks.length,
      uniqueTasks: uniqueGeneratedTasks.length,
      existingTasksCount: project.tasks.length,
    });
  } catch (error) {
    console.error("[AI_TASK_GENERATION_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
