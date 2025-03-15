## WebContainer Context Manager Implementation (Issue #70)

**Context:** This task involves creating a React context to manage the WebContainer lifecycle, ensuring proper initialization, disposal, and access to the WebContainer API.

**Description:**

*   Create a React context to manage the WebContainer lifecycle.
*   Implement a singleton pattern to ensure only one WebContainer instance is created.
*   Provide methods for initializing, disposing, and accessing the WebContainer API.
*   Integrate error boundaries to handle potential WebContainer initialization failures.
*   Implement memory leak prevention mechanisms.
*   **Testing:** Verify successful WebContainer initialization and context functionality.
*   **TODO:** Investigate and fix remaining type errors related to WebContainer integration.

**Dependencies:**
- #68 (Parent epic)

**Completion Criteria:**

* All bullet points above are implemented and tested.
* A commit is created with the changes.
* **Important Note:** The commit message MUST NOT contain backticks (`).
