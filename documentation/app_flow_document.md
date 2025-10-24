# App Flow Document for codeguide-quora-clone

## Onboarding and Sign-In/Sign-Up

When a new visitor lands on the application, they first arrive at a public landing page that highlights the main features of the Q&A platform. This landing page provides clear calls to action for creating an account or signing in. If the visitor clicks the "Sign Up" button, they are taken to the sign-up page located at `/app/sign-up`. Here they can enter their email address and create a secure password. After submitting the form, the system sends a confirmation email. Once they verify their email, the new user is redirected to the sign-in page. The sign-in page at `/app/sign-in` allows returning users to enter their email and password. If a user forgets their password, a "Forgot Password" link on the sign-in page leads to a recovery flow. In this flow, the user enters their email to receive a reset link. Clicking the reset link in the email opens a secure page where they can choose a new password. After successfully resetting their password, they can sign in with the new credentials. Users can also sign out at any time via the "Sign Out" button in the main navigation, which ends the session and returns them to the landing page. Social login methods such as signing in with Google or GitHub can be enabled by adding the respective OAuth providers. In that case, the social login buttons appear on the sign-in and sign-up pages and guide the user through the third-party authentication steps before creating or accessing their account.

## Main Dashboard or Home Page

Once signed in, the user arrives at the main dashboard, located at `/app/dashboard`. This page shows a personalized feed of recent questions from topics the user follows, ordered by newest activity. At the top of the page is a header containing a search bar to look for questions or topics, a user avatar with a dropdown menu for profile and settings, and a button labeled "Ask Question". The left side of the page features a collapsible sidebar listing all available topics and tags, each link filtering the feed by the chosen topic. The right side can display supplemental widgets such as trending questions, suggested users to follow, or promotional announcements. From this main dashboard, a user can navigate to individual question pages, browse a list of topics, or open their own profile page by clicking their avatar.

## Detailed Feature Flows and Page Transitions

### Asking a Question

When a user clicks the "Ask Question" button, a modal dialog opens. Inside this dialog, the user sees fields for the question title, detailed content, and topic selection. The user types in the title and content and picks one or more topics from a dropdown list. When the user submits the form, the frontend calls the Next.js API route `/app/api/questions` with a POST request containing the question data and the user’s session token. The server validates the input, checks the session, and uses Drizzle ORM to insert a new record in the `questions` table. On success, the API returns the new question’s ID, and the interface automatically closes the modal and navigates to `/app/question/[id]` to show the newly created question.

### Viewing and Answering a Question

On an individual question page at `/app/question/[id]`, the top section displays the question title, author avatar, posting time, and vote count. Below that is the question content rendered in rich text format. The user sees upvote and downvote buttons next to the vote count. If the user wants to answer, they scroll down to the answer form at the bottom of the page. They type their answer into a rich text editor and click "Submit Answer." The form sends a POST request to `/app/api/answers` along with the question ID and user session. The backend saves the answer into the `answers` table and returns the new answer data. The page then refreshes the answer list to include the new answer. Users can also edit or delete their own answers by clicking the "Edit" or "Delete" controls, which call PATCH or DELETE requests to `/app/api/answers/[answerId]`.

### Voting and Reputation Updates

When a user clicks the upvote or downvote button on a question or answer, a POST request is sent to `/app/api/votes` indicating the target ID and vote type. The server verifies the user’s identity and checks whether the user has already voted. If the vote is valid, the server updates the `votes` table, recalculates the net vote count, and responds with the updated count. The interface instantly updates the displayed vote count. Behind the scenes, the system tracks user reputation by aggregating vote records, which can be fetched on the profile page.

### Browsing Topics and Searching

If a user clicks on a topic in the sidebar or types a term into the search bar, the application navigates to `/app/topics/[topicSlug]` or `/app/search?q=keyword`. The server fetches matching questions using PostgreSQL full-text search or an external search service. The results page shows a list of question cards similar to the main dashboard feed. From there, the user can click any question to view its details.

### Visiting a User Profile

Clicking on any user avatar or the current user’s avatar in the header navigates to `/app/profile/[username]`. This page displays the user’s avatar, bio, location, and a tabbed interface for viewing their asked questions, answers, and activity history. Each tab shows a list of content items. If the profile belongs to the current user, an "Edit Profile" button appears, leading to the profile editing flow.

### Admin and Moderation Panel

For users with moderator or admin roles, an additional link appears in the main navigation called "Moderation". Clicking it takes the user to `/app/admin/moderation`. Here they see reports of flagged content, pending questions or answers for review, and tools to remove or restore posts. All actions call protected API routes under `/app/api/admin` that verify the user’s role and perform the requested moderation tasks.

## Settings and Account Management

Accessing the user avatar and then clicking "Settings" takes the user to `/app/settings`. This page has sections for "Profile Information", "Account Security", "Email Preferences", and "Notifications." In the profile section, users can update their display name, bio, and avatar image, and these changes are saved via a PATCH request to `/app/api/users/[userId]`. In the account security section, users can change their password or enable two-factor authentication, which triggers a separate flow to register an authenticator app or send SMS codes. The email preferences section lets users opt in or out of daily digests or topic updates by updating settings via `/app/api/users/[userId]/preferences`. After saving changes, a confirmation banner appears and the user can use the side menu or header to return to the dashboard.

## Error States and Alternate Paths

If a user submits invalid data anywhere in the app, the server responds with a 4xx error. The interface shows a clear error message above the form input and highlights the problematic fields. If a user attempts to vote or post without a valid session, they are redirected to the sign-in page with a notification that they need to sign in first. In case of network failures, a banner appears at the top of the page alerting the user to check their connection and offering a retry button. If the user tries to access a question, profile, or admin page that does not exist or that they are not authorized to view, they see a friendly 404 or 403 error page with a link back to the dashboard. During server outages, a maintenance page can be configured at the Next.js level to inform users of downtime and expected return times.

## Conclusion and Overall App Journey

A typical user begins by landing on the public page, signs up or signs in, and enters the dashboard where they see a curated feed of questions. From there they can ask a new question, search or browse topics, read and answer questions, and cast votes. They can visit any user’s profile or manage their own profile and account settings. Moderators have an extra flow for reviewing reported content. Throughout the experience, clear error messaging and recovery flows ensure users can correct mistakes or regain access if they forget their password. This end-to-end journey supports the main goal of fostering community discussions through asking, answering, and voting on questions.