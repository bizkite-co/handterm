## Bypass Command Activity Reset Enhancement

Date: 2024-12-05

### Changes
- Updated BypassCommand to comprehensively reset activity location
- Added explicit clearing of content and group keys
- Maintained existing bypass tutorial signal logic

### Rationale
When bypassing tutorial mode, ensure a complete reset of the activity context. This includes:
- Switching to NORMAL activity type
- Clearing any specific content key
- Removing any group context

### Implementation Details
- Used `useReactiveLocation().updateLocation()` with null values for content and group keys
- Preserved existing message and state management
- Ensured a clean transition from tutorial to normal mode
