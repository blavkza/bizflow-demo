import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      position,
      phone,
      departmentId,
      salary,
      status,
      hireDate,
      address,
    } = body;

    function generateClientNumber() {
      const randomSix = Math.floor(100000 + Math.random() * 900000);
      return `EMP-${randomSix}`;
    }

    const employeeNumber = generateClientNumber();

    const employee = await db.employee.create({
      data: {
        employeeNumber,
        firstName,
        lastName,
        email,
        position,
        phone,
        departmentId,
        salary,
        status,
        hireDate,
        address,
        createdBy: creater?.name,
      },
    });

    await db.notification.create({
      data: {
        title: "New Employee Created",
        message: `Employee ${employee.lastName} ${employee.firstName} , has been created By ${creater.name}.`,
        type: "EMPLOYEE",
        isRead: false,
        actionUrl: `/dashboard/human-resources/employees/${employee.id}`,
        userId: creater.id,
      },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("[MESSAGE ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
export async function GET() {
  try {
    const [employees, departments] = await Promise.all([
      db.employee.findMany({
        include: {
          department: {
            select: {
              id: true,
              name: true,
              manager: {
                select: {
                  name: true,
                },
              },
            },
          },
          payments: {
            select: {
              amount: true,
            },
          },
        },
      }),
      db.department.findMany(),
    ]);

    const serializedEmployees = employees.map((employee) => ({
      id: employee.id,
      employeeId: employee.employeeNumber,
      name: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      department: employee.department?.name || "No Department",
      status: employee.status,
      workType: employee.position || "Not specified",
      salary: employee.salary?.toNumber() || 0,
      location: employee.address || "Not specified",
      startDate: employee.hireDate?.toLocaleDateString() || "Not specified",
      manager: employee.department?.manager?.name || "No manager",
      avatar: employee.avatar,
    }));

    const statuses = [...new Set(employees.map((emp) => emp.status))];
    const workTypes = [
      ...new Set(employees.map((emp) => emp.position || "Not specified")),
    ];

    return NextResponse.json({
      employees: serializedEmployees,
      departments,
      statuses,
      workTypes,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch employees", error },
      { status: 500 }
    );
  }
}
