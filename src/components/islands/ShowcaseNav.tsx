import * as React from 'react';

import { Combobox } from '@/components/ui/combobox';
import { CommandPalette } from '@/components/ui/command-palette';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
} from '@/components/ui/menubar';
import { Stepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Kbd } from '@/components/ui/kbd';
import ErrorBoundary from './ErrorBoundary';

const FRAMEWORKS = ['Astro', 'Next.js', 'SvelteKit', 'Remix', 'Nuxt', 'SolidStart', 'Qwik City'];

export default function ShowcaseNav() {
  return (
    <ErrorBoundary name="ShowcaseNav">
      <NavInner />
    </ErrorBoundary>
  );
}

function NavInner() {
  const [framework, setFramework] = React.useState<string | null>('Astro');
  const [cmdOpen, setCmdOpen] = React.useState(false);

  return (
    <div className="grid max-w-xl gap-8">
      {/* Combobox */}
      <section className="space-y-2">
        <Label>Framework (combobox)</Label>
        <Combobox items={FRAMEWORKS} value={framework} onValueChange={setFramework} placeholder="Search frameworks…" />
      </section>

      {/* Command palette */}
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Command palette</p>
        <Button variant="outline" onClick={() => setCmdOpen(true)}>
          Open command palette <Kbd className="ml-2">⌘K</Kbd>
        </Button>
        <CommandPalette
          open={cmdOpen}
          onOpenChange={setCmdOpen}
          items={[
            { label: 'Go to Gallery', hint: 'g' },
            { label: 'Go to Docs', hint: 'd' },
            { label: 'New issue', hint: 'n' },
            { label: 'Toggle theme', hint: 't' },
          ]}
        />
      </section>

      {/* Navigation menu */}
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Navigation menu</p>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Product</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="#">Gallery</NavigationMenuLink>
                <NavigationMenuLink href="#">Demos</NavigationMenuLink>
                <NavigationMenuLink href="#">Docs</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="#">Blog</NavigationMenuLink>
                <NavigationMenuLink href="#">Roadmap</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </section>

      {/* Menubar */}
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Menubar</p>
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New file</MenubarItem>
              <MenubarItem>Open…</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Save</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Undo</MenubarItem>
              <MenubarItem>Redo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </section>

      {/* Stepper */}
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stepper</p>
        <Stepper steps={['Account', 'Profile', 'Review']} current={1} />
      </section>
    </div>
  );
}
