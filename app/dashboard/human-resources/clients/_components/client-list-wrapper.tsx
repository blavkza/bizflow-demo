"use client";

import { useState } from "react";
import SearchInput from "./search";
import ClientList from "./client-list";
import NoClient from "./no-client";

export default function ClientListWrapper({ clients }: { clients: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  return (
    <>
      <SearchInput
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      {clients.length > 0 ? (
        <ClientList
          clients={clients}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
        />
      ) : (
        <NoClient />
      )}
    </>
  );
}
