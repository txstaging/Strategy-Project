import {
  Component,
  Input,
  OnInit,
  signal,
  ViewChild,
  AfterViewInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import {
  CarouselModule,
  OwlOptions,
  CarouselComponent,
  SlidesOutputData,
} from 'ngx-owl-carousel-o';
import { BlogService } from '../../blogs/services/blog.service';
import { IGetAllBlogs } from '../../blogs/interfaces/IGetAllBlogs';
import { HttpErrorResponse } from '@angular/common/http';
import { PageTitleService } from '../../page-titles/services/page-title.service';
import { IPageTitle } from '../../page-titles/interfaces/IPageTitle';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CarouselModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent implements OnInit, AfterViewInit {
  @Input() userInfo: Record<string, any> = {};
  @ViewChild('owlCarousel') owlCarousel!: CarouselComponent;

  private blogService = inject(BlogService);
  private pageTitleService = inject(PageTitleService);

  showLoginButton = false;
  activeSlideIndex = signal<number>(0);

  // Blog data for carousel
  carouselBlogs = signal<IGetAllBlogs[]>([]);
  hasBlogs = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Page titles
  titlesMap = signal<Record<string, string>>({});

  // Owl Carousel Options
  customOptions: OwlOptions = {
    rtl: true,
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: false,
    dots: true,
    dotsEach: false,
    dotsData: false,
    nav: false, // No navigation arrows
    responsive: {
      0: {
        items: 1,
      },
    },
    autoplay: true,
    autoplayTimeout: 4000,
    autoplaySpeed: 2000,
    navSpeed: 1000,
    dotsSpeed: 1000,
    autoplayHoverPause: true,
    autoHeight: true,
    margin: 0,
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (localStorage.getItem('userInfo')) {
      this.userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    } else {
      this.showLoginButton = true;
    }

    // Fetch blogs from API
    this.fetchBlogs();

    // Fetch page titles
    this.pageTitleService.getAllTitles().subscribe({
      next: (res) => {
        const map: Record<string, string> = {};
        res.titles.forEach(t => map[t.key] = t.currentValue);
        this.titlesMap.set(map);
      },
    });
  }

  ngAfterViewInit(): void {
    // Initialize indicators on the first render
    setTimeout(() => {
      this.updateIndicators(0);
    }, 100);

    // Set up event listener for carousel slide change
    if (this.owlCarousel) {
      this.owlCarousel.translated.subscribe((event: SlidesOutputData) => {
        if (event.startPosition !== undefined) {
          this.activeSlideIndex.set(event.startPosition);
          this.updateIndicators(event.startPosition);
        }
      });
    }
  }

  // Helper method to update indicator colors
  updateIndicators(activeIndex: number): void {
    const dots = document.querySelectorAll('.owl-dot');
    if (dots && dots.length) {
      dots.forEach((dot, index) => {
        if (index === activeIndex) {
          dot.classList.add('active');
          dot
            .querySelector('span')
            ?.style.setProperty('background-color', '#00a05a', 'important');
        } else {
          dot.classList.remove('active');
          dot
            .querySelector('span')
            ?.style.setProperty('background-color', '#D6D6D6', '');
        }
      });
    }
  }

  fetchBlogs(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.blogService.getAllBlogs().subscribe({
      next: (response) => {
        const blogs = response.data;
        // Sort by date (newest first) and limit to first 3
        const sortedBlogs = blogs
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3);

        this.hasBlogs.set(sortedBlogs.length > 0);
        this.carouselBlogs.set(sortedBlogs);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to load blogs:', err);
        this.error.set(`Failed to load blogs: ${err.message}`);
        this.isLoading.set(false);
        this.hasBlogs.set(false);
      }
    });
  }

  handleCardKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      this.navigateToStrategicPlan();
    }
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  navigateToStrategicPlan(): void {
    this.router.navigate(['/plans']);
  }

  navigateToBlog(blogId: number): void {
    this.router.navigate(['/blogs', blogId]);
  }

  t(key: string, fallback: string): string {
    return this.titlesMap()[key] || fallback;
  }
}
