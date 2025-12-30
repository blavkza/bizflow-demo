import axios from "axios";
import { PackageData, CreateSubpackageData } from "./types";

export async function getPackage(id: string): Promise<PackageData> {
  try {
    const response = await fetch(`/api/packages/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch package");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching package:", error);
    throw error;
  }
}

export async function updatePackage(id: string, data: Partial<PackageData>) {
  try {
    const response = await fetch(`/api/packages/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update package");
    }

    return response.json();
  } catch (error) {
    console.error("Error updating package:", error);
    throw error;
  }
}

export async function deletePackage(id: string) {
  try {
    const response = await fetch(`/api/packages/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete package");
    }

    return response.json();
  } catch (error) {
    console.error("Error deleting package:", error);
    throw error;
  }
}

export async function createSubpackage(packageId: string, data: any) {
  try {
    const response = await fetch(`/api/subpackages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...data, packageId }),
    });

    if (!response.ok) {
      throw new Error("Failed to create subpackage");
    }

    return response.json();
  } catch (error) {
    console.error("Error creating subpackage:", error);
    throw error;
  }
}

export async function updateSubpackage(subpackageId: string, data: any) {
  try {
    const response = await fetch(`/api/subpackages/${subpackageId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update subpackage");
    }

    return response.json();
  } catch (error) {
    console.error("Error updating subpackage:", error);
    throw error;
  }
}

export async function deleteSubpackage(subpackageId: string) {
  try {
    const response = await fetch(`/api/subpackages/${subpackageId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete subpackage");
    }

    return response.json();
  } catch (error) {
    console.error("Error deleting subpackage:", error);
    throw error;
  }
}

export async function duplicateSubpackage(
  subpackageId: string,
  duplicateData: CreateSubpackageData & { packageId: string }
) {
  try {
    const response = await fetch(`/api/subpackages/duplicate/${subpackageId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(duplicateData),
    });

    if (!response.ok) {
      throw new Error("Failed to duplicate subpackage");
    }

    return response.json();
  } catch (error) {
    console.error("Error duplicating subpackage:", error);
    throw error;
  }
}
