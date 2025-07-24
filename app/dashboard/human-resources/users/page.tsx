"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import Header from "./_components/header";
import StatsCard from "./_components/stats-card";
import Userslist from "./_components/users-list";
import { UserRole, UserStatus } from "@prisma/client";
import Loading from "./_components/loading";

interface User {
  id: string;
  name: string;
  userName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar: string | null;
  status: UserStatus;
  createdAt: Date;
  lastLogin: Date | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/api/users/all-users");
        setUsers(response.data);
      } catch (err) {
        setError("Failed to fetch users");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Header />
      <StatsCard users={users} />
      <Userslist users={users} />
    </div>
  );
}
