import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CategoryLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[250px]" />
          <Skeleton className="h-4 w-[350px] mt-2" />
          <div className="flex items-center gap-2 pt-2">
            <Skeleton className="h-9 w-[300px]" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Skeleton className="h-4 w-[120px]" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-[100px]" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-[80px]" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-[100px]" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-[80px]" />
                </TableHead>
                <TableHead className="text-right">
                  <Skeleton className="h-4 w-[80px] ml-auto" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5)
                .fill(null)
                .map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <Skeleton className="h-5 w-[150px]" />
                        <Skeleton className="h-4 w-[200px] mt-1" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[120px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[40px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-[70px]" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-[100px] ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
