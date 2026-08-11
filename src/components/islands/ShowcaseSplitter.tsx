import { Splitter, SplitterPanel, SplitterResizeTrigger } from '@/components/ui/splitter';
import ErrorBoundary from './ErrorBoundary';

// Splitter owns internal resize state (the zag.js state machine) — the whole
// composition lives in one island file, same rule as Dialog/Tabs/Toast.
export default function ShowcaseSplitter() {
  return (
    <ErrorBoundary name="ShowcaseSplitter">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Drag the handle, or focus it and press the arrow keys (Home/End jump to
          the min/max) — a common master-detail layout primitive.
        </p>
        <div className="h-64">
          <Splitter
            panels={[
              { id: 'nav', defaultSize: 30, minSize: 15, maxSize: 50 },
              { id: 'detail', defaultSize: 70, minSize: 30 },
            ]}
          >
            <SplitterPanel id="nav">
              <p className="text-sm font-medium text-foreground">Navigation</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Overview</li>
                <li>Resources</li>
                <li>Settings</li>
              </ul>
            </SplitterPanel>
            <SplitterResizeTrigger
              id="nav:detail"
              aria-label="Resize navigation and detail panels"
            />
            <SplitterPanel id="detail">
              <p className="text-sm font-medium text-foreground">Detail pane</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Content on this side resizes as the left pane grows or shrinks,
                clamped to each panel&apos;s min/max size.
              </p>
            </SplitterPanel>
          </Splitter>
        </div>
      </div>
    </ErrorBoundary>
  );
}
