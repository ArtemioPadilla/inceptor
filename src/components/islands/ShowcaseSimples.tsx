import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ErrorBoundary from './ErrorBoundary';

// Renders all "simple" (non-compound, non-interactive-state) shadcn components
// in one island to minimize hydration overhead on the /showcase page.
export default function ShowcaseSimples() {
  return (
    <ErrorBoundary name="ShowcaseSimples">
    <div className="space-y-8">
      {/* Button — all variants */}
      <section>
        <p className="mb-3 text-sm font-semibold text-foreground">Button</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Input + Label */}
      <section>
        <p className="mb-3 text-sm font-semibold text-foreground">Input + Label</p>
        <div className="space-y-2 max-w-xs">
          <Label htmlFor="showcase-email-simples">Email address</Label>
          <Input
            id="showcase-email-simples"
            type="email"
            placeholder="you@example.com"
          />
        </div>
      </section>

      {/* Badge — all variants */}
      <section>
        <p className="mb-3 text-sm font-semibold text-foreground">Badge</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      {/* Card */}
      <section>
        <p className="mb-3 text-sm font-semibold text-foreground">Card</p>
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Card description goes here.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Card content — any React node can go here.
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Action</Button>
          </CardFooter>
        </Card>
      </section>

      {/* Table */}
      <section>
        <p className="mb-3 text-sm font-semibold text-foreground">Table</p>
        <Table>
          <TableCaption>A simple data table demo.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Alice</TableCell>
              <TableCell>
                <Badge variant="default">Active</Badge>
              </TableCell>
              <TableCell>Admin</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Bob</TableCell>
              <TableCell>
                <Badge variant="secondary">Invited</Badge>
              </TableCell>
              <TableCell>Member</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Carol</TableCell>
              <TableCell>
                <Badge variant="outline">Pending</Badge>
              </TableCell>
              <TableCell>Viewer</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </div>
    </ErrorBoundary>
  );
}
