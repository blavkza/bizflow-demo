"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  FileText,
  CreditCard,
} from "lucide-react";
import { QuotationWithRelations } from "@/types/quotation";

export const ClientInfoCard = ({
  quotation,
}: {
  quotation: QuotationWithRelations;
}) => {
  const client = quotation.client;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Client Information</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Information */}
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{client.name}</span>
        </div>

        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{client.email || "No email provided"}</span>
        </div>

        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{client.phone || "No phone provided"}</span>
        </div>

        {client.phone2 && (
          <div className="flex items-center space-x-2 ml-6">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{client.phone2}</span>
          </div>
        )}

        {client.website && (
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-blue-600 hover:underline">
              <a
                href={
                  client.website.startsWith("http")
                    ? client.website
                    : `https://${client.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                {client.website}
              </a>
            </span>
          </div>
        )}

        {/* Tax Information */}
        {(client.taxNumber || client.vatNumber) && (
          <div className="border-t pt-3">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">
              Tax Information
            </h3>
            <div className="space-y-1 text-sm">
              {client.taxNumber && (
                <div className="flex justify-between">
                  <span>Tax Number:</span>
                  <span className="font-medium">{client.taxNumber}</span>
                </div>
              )}
              {client.vatNumber && (
                <div className="flex justify-between">
                  <span>VAT Number:</span>
                  <span className="font-medium">{client.vatNumber}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Company Information */}
        {(client.company ||
          client.companyFullName ||
          client.tradingName ||
          client.registrationNumber) && (
          <div className="border-t pt-3">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">
              Company Information
            </h3>
            <div className="space-y-2 text-sm">
              {client.company && (
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{client.company}</span>
                </div>
              )}
              {client.companyFullName && (
                <div className="flex justify-between">
                  <span>Legal Name:</span>
                  <span className="font-medium">{client.companyFullName}</span>
                </div>
              )}
              {client.tradingName && (
                <div className="flex justify-between">
                  <span>Trading Name:</span>
                  <span className="font-medium">{client.tradingName}</span>
                </div>
              )}
              {client.registrationNumber && (
                <div className="flex justify-between">
                  <span>Registration #:</span>
                  <span className="font-medium">
                    {client.registrationNumber}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Address Information */}
        {(client.address || client.companyaddress) && (
          <div className="border-t pt-3">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">
              Address Information
            </h3>
            <div className="space-y-2 text-sm">
              {client.address && (
                <div>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="font-medium">Primary Address:</span>
                      <p className="text-muted-foreground">{client.address}</p>
                      {(client.street ||
                        client.town ||
                        client.province ||
                        client.country) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {client.street && <span>{client.street}, </span>}
                          {client.town && <span>{client.town}, </span>}
                          {client.province && <span>{client.province}, </span>}
                          {client.country && <span>{client.country}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {client.companyaddress && (
                <div>
                  <div className="flex items-start space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="font-medium">Company Address:</span>
                      <p className="text-muted-foreground">
                        {client.companyaddress}
                      </p>
                      {(client.companystreet ||
                        client.companytown ||
                        client.companyProvince ||
                        client.companyCountry) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {client.companystreet && (
                            <span>{client.companystreet}, </span>
                          )}
                          {client.companytown && (
                            <span>{client.companytown}, </span>
                          )}
                          {client.companyProvince && (
                            <span>{client.companyProvince}, </span>
                          )}
                          {client.companyCountry && (
                            <span>{client.companyCountry}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Information */}
        {client.additionalInfo && (
          <div className="border-t pt-3">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">
              Additional Information
            </h3>
            <p className="text-sm text-muted-foreground">
              {client.additionalInfo}
            </p>
          </div>
        )}

        {/* Contact Numbers */}
        {(client.telNo1 || client.telNo2) && (
          <div className="border-t pt-3">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">
              Contact Numbers
            </h3>
            <div className="space-y-1 text-sm">
              {client.telNo1 && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>Tel 1: {client.telNo1}</span>
                </div>
              )}
              {client.telNo2 && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>Tel 2: {client.telNo2}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
