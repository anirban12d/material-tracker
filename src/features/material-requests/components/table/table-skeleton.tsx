import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card">
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        <Table className="w-full">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 bg-muted sm:h-12">
                Material Name
              </TableHead>
              <TableHead className="h-10 bg-muted sm:h-12">Quantity</TableHead>
              <TableHead className="hidden h-10 bg-muted sm:table-cell sm:h-12">
                Unit
              </TableHead>
              <TableHead className="h-10 bg-muted sm:h-12">Status</TableHead>
              <TableHead className="hidden h-10 bg-muted sm:table-cell sm:h-12">
                Priority
              </TableHead>
              <TableHead className="hidden h-10 bg-muted sm:table-cell sm:h-12">
                Requested By
              </TableHead>
              <TableHead className="hidden h-10 bg-muted sm:table-cell sm:h-12">
                Date
              </TableHead>
              <TableHead className="h-10 w-10 bg-muted sm:h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="py-3">
                  <Skeleton className="h-4 w-24 sm:w-32" />
                </TableCell>
                <TableCell className="py-3">
                  <Skeleton className="h-4 w-12 sm:w-16" />
                </TableCell>
                <TableCell className="hidden py-3 sm:table-cell">
                  <Skeleton className="h-4 w-12 sm:w-14" />
                </TableCell>
                <TableCell className="py-3">
                  <Skeleton className="h-6 w-16 rounded-full sm:w-20" />
                </TableCell>
                <TableCell className="hidden py-3 sm:table-cell">
                  <Skeleton className="h-6 w-14 rounded-full sm:w-16" />
                </TableCell>
                <TableCell className="hidden py-3 sm:table-cell">
                  <Skeleton className="h-4 w-20 sm:w-24" />
                </TableCell>
                <TableCell className="hidden py-3 sm:table-cell">
                  <Skeleton className="h-4 w-20 sm:w-24" />
                </TableCell>
                <TableCell className="py-3">
                  <Skeleton className="h-8 w-8 rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
