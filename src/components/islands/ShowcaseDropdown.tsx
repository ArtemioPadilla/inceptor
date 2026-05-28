import { CopyIcon, PencilIcon, Settings2Icon, TrashIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ErrorBoundary from './ErrorBoundary';

// Wraps the DropdownMenu compound component in a single island.
// Lucide icons are imported here rather than lazily — the island itself
// is already loaded lazily via client:visible on the showcase page.
//
// Base UI uses a `render` prop instead of Radix's `asChild` pattern.
// render={<Button variant="outline" />} lets Base UI merge open/close
// behavior onto the Button element without the Radix Slot pattern.
export default function ShowcaseDropdown() {
  return (
    <ErrorBoundary name="ShowcaseDropdown">
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <Settings2Icon className="mr-2 h-4 w-4" />
        Actions
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Item actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <PencilIcon className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CopyIcon className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <TrashIcon className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </ErrorBoundary>
  );
}
