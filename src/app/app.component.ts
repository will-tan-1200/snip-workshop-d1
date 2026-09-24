import { Component, OnInit, inject, signal } from "@angular/core";
import { Link, LinkService } from "./link.service";

@Component({
  selector: "app-root",
  standalone: true,
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  private readonly linkService = inject(LinkService);

  readonly url = signal("");
  readonly links = signal<Link[]>([]);
  readonly createdLink = signal<Link | null>(null);
  readonly error = signal("");
  readonly submitting = signal(false);

  ngOnInit(): void {
    this.loadLinks();
  }

  submit(): void {
    const value = this.url().trim();
    if (!this.isHttpUrl(value)) {
      this.error.set("Enter a valid http:// or https:// URL.");
      return;
    }

    this.error.set("");
    this.createdLink.set(null);
    this.submitting.set(true);
    this.linkService.create(value).subscribe({
      next: (link) => {
        this.createdLink.set(link);
        this.url.set("");
        this.submitting.set(false);
        this.loadLinks();
      },
      error: (response: { error?: { error?: string } }) => {
        this.error.set(response.error?.error || "Could not create the short link.");
        this.submitting.set(false);
      },
    });
  }

  private loadLinks(): void {
    this.linkService.list().subscribe({
      next: (links) => this.links.set(links),
      error: () => this.error.set("Could not load links. Is the backend running on port 3000?"),
    });
  }

  private isHttpUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }
}