import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin } from "lucide-react";
import { ToolRentalDetail } from "../types";

interface RenterInformationProps {
  rental: ToolRentalDetail;
}

export default function RenterInformation({ rental }: RenterInformationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Renter Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Business</p>
            <p className="font-medium">{rental.businessName}</p>
          </div>
          {rental.quotation?.client && (
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{rental.quotation.client.name}</p>
            </div>
          )}
        </div>
        <div className="space-y-2 pt-2 border-t">
          {rental.renterPhone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a
                href={`tel:${rental.renterPhone}`}
                className="text-sm hover:underline"
              >
                {rental.renterPhone}
              </a>
            </div>
          )}
          {rental.renterEmail && (
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${rental.renterEmail}`}
                className="text-sm hover:underline"
              >
                {rental.renterEmail}
              </a>
            </div>
          )}
          {rental.quotation?.client?.address && (
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm">{rental.quotation.client.address}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
