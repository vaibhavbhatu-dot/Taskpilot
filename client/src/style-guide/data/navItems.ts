export interface NavItem {
  label: string;
  path: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    id: 'foundations',
    label: 'Foundations',
    items: [
      { label: 'Colors',     path: '/style-guide/foundations/colors'     },
      { label: 'Typography', path: '/style-guide/foundations/typography' },
      { label: 'Spacing',    path: '/style-guide/foundations/spacing'    },
      { label: 'Layout',     path: '/style-guide/foundations/layout'     },
    ],
  },
  {
    id: 'components',
    label: 'Components',
    items: [
      { label: 'Button',   path: '/style-guide/components/button'   },
      { label: 'Input',    path: '/style-guide/components/input'    },
      { label: 'Card',     path: '/style-guide/components/card'     },
      { label: 'Badge',    path: '/style-guide/components/badge'    },
      { label: 'Alert',    path: '/style-guide/components/alert'    },
      { label: 'Feedback',      path: '/style-guide/components/feedback'       },
      { label: 'Modal',         path: '/style-guide/components/modal'          },
      { label: 'Select',        path: '/style-guide/components/select'         },
      { label: 'AI Suggestion', path: '/style-guide/components/ai-suggestion'  },
      { label: 'OTP Input',    path: '/style-guide/components/otp-input'       },
      { label: 'Stepper',      path: '/style-guide/components/stepper'         },
    ],
  },
  {
    id: 'product',
    label: 'Product',
    items: [
      { label: 'ScoreBar',    path: '/style-guide/product/score-bar'    },
      { label: 'ResumeCard',  path: '/style-guide/product/resume-card'  },
      { label: 'Upload Zone', path: '/style-guide/product/upload-zone'  },
    ],
  },
];
