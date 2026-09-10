import {
  Component,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PagesHeaderComponent } from '../../../shared/components/pages-header/pages-header.component';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterModule, PagesHeaderComponent],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css',
})
export class FaqComponent implements AfterViewInit {
  @ViewChildren('categorySection') categorySections!: QueryList<ElementRef>;

  // FAQ content
  faq = {
    title: 'الأسئلة الشائعة',
    categories: [
      {
        title: 'معلومات عامة عن سلاح الصيانة',
        questions: [
          {
            question: 'ما هو سلاح الصيانة؟',
            answer:
              'سلاح الصيانة هو فرع من فروع الأسلحة في القوات البرية المملكة السعودية، يعمل على صيانة الأسلحة والمعدات والأجهزة والآليات، والمحافظة على جاهزيتها لتعمل في مختلف الأحوال والظروف بكفاءة عالية.',
          },
          {
            question: 'متى تأسس سلاح الصيانة؟',
            answer:
              'تعتبر أول نواة لسلاح الصيانة كانت في عهد الملك عبد العزيز رحمه الله، وكانت عبارة عن ورش صغيرة تفي بمتطلبات ذلك الوقت. وفي عام 1369هـ تم إحداث تشكيل جديد يرتبط بهيئة الإمدادات وتموين الجيش سمي "مساعد هيئة الإمدادات والتموين للصيانة والنقل".',
          },
          {
            question: 'ما هي مسؤوليات سلاح الصيانة؟',
            answer:
              'يتولى سلاح الصيانة حالياً كافة أعمال الإدارة التموينية لصيانة جميع أسلحة وأجهزة معدات وعربات وآليات القوات البرية لتكون صالحة للعمل في كل الأحوال والظروف، كما يقوم ببناء وتأهيل الكوادر الفنية من ضباط وأفراد وموظفين.',
          },
        ],
      },
      {
        title: 'التاريخ والتطور',
        questions: [
          {
            question: 'ما هي أبرز إنجازات سلاح الصيانة في مجال التقنية؟',
            answer:
              'يعد سلاح الصيانة أول من استخدم الحاسب الآلي في المملكة العربية السعودية لصالح القوات البرية في عام 1386هـ الموافق 1966م، وذلك لإدارة أعمال التموين الفني آلياً وتسريع الأعمال الإدارية. وفي عام 1968م، شهد الملك فيصل تركيب حاسب آلي من نوع (آي بي إم 360) في قسم التموين.',
          },
          {
            question: 'متى تم فصل سلاح النقل عن سلاح الصيانة؟',
            answer:
              'تم فصل سلاح النقل عن سلاح الصيانة في عام 1375هـ، ولكن بقي سلاح الصيانة بالتزاماته الفنية تجاه أعمال الصيانة والتموين الفني وخاصة تزويد الجيش العربي السعودي بالمعدات والآليات وقطع الغيار.',
          },
          {
            question: 'كيف تطورت آليات العمل في سلاح الصيانة؟',
            answer:
              'تطورت آليات العمل في سلاح الصيانة من ورش صغيرة في البداية إلى نظام متكامل للصيانة والتموين. وفي عام 1382هـ الموافق 1963م تم وضع برنامج لإدارة آليات الجيش بالاستفادة من خبرات سلاح المهندسين الأمريكي، وتم توقيع اتفاقية لتنظيم أعمال صيانة الأسلحة والعربات والآليات والتموين بقطع الغيار. ثم في عام 1386هـ تم استخدام الحاسب الآلي لأتمتة العمليات الإدارية والفنية.',
          },
        ],
      },
      {
        title: 'الأنظمة والإجراءات',
        questions: [
          {
            question: 'ما هي مستويات الصيانة في سلاح الصيانة؟',
            answer:
              'يعمل سلاح الصيانة وفقاً لنظام المستويات بدءاً من الصيانة الوقائية والصيانة المباشرة ثم العامة وصولاً إلى مستوى القواعد الرئيسية. هذا النظام يضمن كفاءة عمليات الصيانة وجاهزية المعدات العسكرية في جميع الأوقات.',
          },
          {
            question: 'كيف يتم تأهيل الكوادر الفنية في سلاح الصيانة؟',
            answer:
              'يقوم سلاح الصيانة ببناء وتأهيل الكوادر الفنية من ضباط وأفراد وموظفين من خلال برامج تدريبية متخصصة لضمان مواكبة أحدث التقنيات والأساليب في مجال الصيانة العسكرية، مما يضمن الحفاظ على جاهزية المعدات والآليات للعمل بكفاءة عالية.',
          },
          {
            question: 'ما هو دور سلاح الصيانة في إدارة التموين الفني؟',
            answer:
              'يتولى سلاح الصيانة إدارة التموين الفني للقوات البرية، حيث يقوم بتوفير قطع الغيار والمعدات اللازمة لصيانة الأسلحة والآليات. وقد كان سلاح الصيانة رائداً في استخدام الحاسب الآلي لإدارة أعمال التموين الفني بطريقة آلية منذ عام 1966م لضمان الدقة والسرعة في توفير احتياجات القوات.',
          },
        ],
      },
    ],
  };

  // Active category for highlighting in the sidebar
  activeCategory = 0;

  ngAfterViewInit() {
    // Set up intersection observer to detect which section is in view
    this.setupIntersectionObserver();
  }

  // Handle sidebar navigation click without page refresh
  scrollToCategory(index: number, event: Event) {
    event.preventDefault();
    this.activeCategory = index;

    const categoryElements = this.categorySections.toArray();
    if (categoryElements[index]) {
      categoryElements[index].nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  // Set up intersection observer to update active category based on scroll position
  private setupIntersectionObserver() {
    if (typeof IntersectionObserver !== 'undefined') {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3,
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id.startsWith('category-')) {
              this.activeCategory = parseInt(id.split('-')[1]);
            }
          }
        });
      }, options);

      // Observe all category sections
      setTimeout(() => {
        this.categorySections.forEach((section) => {
          observer.observe(section.nativeElement);
        });
      }, 100);
    }
  }
}
