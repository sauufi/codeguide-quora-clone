flowchart TD
  A[Start] --> B[Sign In Sign Up]
  B --> C{Authenticated}
  C -- Yes --> D[Dashboard]
  C -- No --> B
  D --> E[View Feed]
  D --> F[User Profile]
  E --> G[Select Question]
  G --> H[Question Details]
  H --> I[Post Answer]
  I --> J[API Route]
  J --> K[Database]
  K --> E
  H --> L[Upvote Or Downvote]
  L --> J
  D --> M[Ask Question]
  M --> N[Question Form]
  N --> J
  D --> O[Search]
  O --> P[Search Results]
  P --> H