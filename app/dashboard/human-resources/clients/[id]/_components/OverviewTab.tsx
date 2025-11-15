// app/dashboard/human-resources/clients/[id]/_components/OverviewTab.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  FileDigit,
  Building,
  Globe,
  User,
  CreditCard,
  FileSearch,
  PhoneCall,
} from "lucide-react";
import { ClientWithRelations } from "./types";

interface OverviewTabProps {
  client: ClientWithRelations;
}

export function OverviewTab({ client }: OverviewTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "INDIVIDUAL":
        return "bg-blue-100 text-blue-800";
      case "COMPANY":
        return "bg-purple-100 text-purple-800";
      case "GOVERNMENT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalRevenue =
    client.invoices?.reduce(
      (sum, invoice) => sum + (invoice.totalAmount || 0),
      0
    ) || 0;

  const totalReceived =
    client.invoices
      ?.flatMap((i) => i.payments || [])
      .reduce((sum, payment) => sum + (payment?.amount || 0), 0) || 0;

  const outstandingBalance = totalRevenue - totalReceived;

  return (
    <div className="space-y-6">
      {/* Contact & Basic Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{client.email}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
            {client.phone2 && (
              <div className="flex items-center space-x-3">
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
                <span>{client.phone2}</span>
              </div>
            )}
            {client.website && (
              <div className="flex items-center space-x-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {client.website}
                </a>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Client since {new Date(client.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Client Type:</span>
              <Badge className={getTypeColor(client.type)}>{client.type}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status:</span>
              <Badge className={getStatusColor(client.status)}>
                {client.status}
              </Badge>
            </div>
            {client.assignedTo && (
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Assigned to: {client.assignedTo}</span>
              </div>
            )}
            {client.source && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source:</span>
                <span>{client.source}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Personal Address */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Address</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {client.address && (
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm font-medium">Full Address</p>
                  <p className="text-sm text-muted-foreground">
                    {client.address}
                  </p>
                </div>
              </div>
            )}
            {client.country && (
              <div>
                <p className="text-sm font-medium">Country</p>
                <p className="text-sm text-muted-foreground">
                  {client.country}
                </p>
              </div>
            )}
            {client.province && (
              <div>
                <p className="text-sm font-medium">Province</p>
                <p className="text-sm text-muted-foreground">
                  {client.province}
                </p>
              </div>
            )}
            {client.town && (
              <div>
                <p className="text-sm font-medium">Town</p>
                <p className="text-sm text-muted-foreground">{client.town}</p>
              </div>
            )}
            {client.village && (
              <div>
                <p className="text-sm font-medium">Village</p>
                <p className="text-sm text-muted-foreground">
                  {client.village}
                </p>
              </div>
            )}
            {client.street && (
              <div>
                <p className="text-sm font-medium">Street</p>
                <p className="text-sm text-muted-foreground">{client.street}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Company Information - Only show for COMPANY type */}
      {client.type !== "INDIVIDUAL" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Company Information</h3>

          {/* Company Details */}
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {client.companyFullName && (
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="text-sm font-medium">Full Name</p>
                      <p className="text-sm text-muted-foreground">
                        {client.company}
                      </p>
                    </div>
                  </div>
                )}
                {client.tradingName && (
                  <div>
                    <p className="text-sm font-medium">Trading Name</p>
                    <p className="text-sm text-muted-foreground">
                      {client.tradingName}
                    </p>
                  </div>
                )}
                {client.registrationNumber && (
                  <div>
                    <p className="text-sm font-medium">Registration Number</p>
                    <p className="text-sm text-muted-foreground">
                      {client.registrationNumber}
                    </p>
                  </div>
                )}
                {client.vatNumber && (
                  <div>
                    <p className="text-sm font-medium">VAT Number</p>
                    <p className="text-sm text-muted-foreground">
                      {client.vatNumber}
                    </p>
                  </div>
                )}
                {client.taxNumber && (
                  <div>
                    <p className="text-sm font-medium">Tax Number</p>
                    <p className="text-sm text-muted-foreground">
                      {client.taxNumber}
                    </p>
                  </div>
                )}
                {client.telNo1 && (
                  <div>
                    <p className="text-sm font-medium">Telephone 1</p>
                    <p className="text-sm text-muted-foreground">
                      {client.telNo1}
                    </p>
                  </div>
                )}
                {client.telNo2 && (
                  <div>
                    <p className="text-sm font-medium">Telephone 2</p>
                    <p className="text-sm text-muted-foreground">
                      {client.telNo2}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Address */}
          {(client.companyCountry ||
            client.companyProvince ||
            client.companytown) && (
            <Card>
              <CardHeader>
                <CardTitle>Company Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {client.companyaddress && (
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="text-sm font-medium">Full Address</p>
                        <p className="text-sm text-muted-foreground">
                          {client.companyaddress}
                        </p>
                      </div>
                    </div>
                  )}
                  {client.companyCountry && (
                    <div>
                      <p className="text-sm font-medium">Country</p>
                      <p className="text-sm text-muted-foreground">
                        {client.companyCountry}
                      </p>
                    </div>
                  )}
                  {client.companyProvince && (
                    <div>
                      <p className="text-sm font-medium">Province</p>
                      <p className="text-sm text-muted-foreground">
                        {client.companyProvince}
                      </p>
                    </div>
                  )}
                  {client.companytown && (
                    <div>
                      <p className="text-sm font-medium">Town</p>
                      <p className="text-sm text-muted-foreground">
                        {client.companytown}
                      </p>
                    </div>
                  )}
                  {client.companyvillage && (
                    <div>
                      <p className="text-sm font-medium">Village</p>
                      <p className="text-sm text-muted-foreground">
                        {client.companyvillage}
                      </p>
                    </div>
                  )}
                  {client.companystreet && (
                    <div>
                      <p className="text-sm font-medium">Street</p>
                      <p className="text-sm text-muted-foreground">
                        {client.companystreet}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Company Information */}
          {client.additionalInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {client.additionalInfo}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {client.creditLimit && (
              <div>
                <p className="text-sm font-medium">Credit Limit</p>
                <p className="text-2xl font-bold">
                  R {client.creditLimit.toLocaleString()}
                </p>
              </div>
            )}
            {client.paymentTerms && (
              <div>
                <p className="text-sm font-medium">Payment Terms</p>
                <p className="text-2xl font-bold">{client.paymentTerms} days</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Currency</p>
              <p className="text-2xl font-bold">{client.currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
            <FileDigit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {client.invoices?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {client.invoices?.filter((i) => i.status === "PAID").length || 0}{" "}
              paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              R{totalReceived.toLocaleString()} received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{outstandingBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Balance due</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {client.documents?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {client.documents?.filter((d) => d.type === "CONTRACT").length ||
                0}{" "}
              contracts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FileSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {client.projects?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {client.quotations?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total quotations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {client.transactions?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">All transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Notes Section */}
      {client.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {client.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
