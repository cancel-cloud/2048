# GitHub Copilot Instructions for 2048 Game Repository

## Repository Context
This is a Next.js-based implementation of the classic 2048 puzzle game with TypeScript, featuring server-side game logic and a responsive web interface.

## Project Structure
- **Frontend**: Next.js 14.2.12 with React 18, TypeScript, and Tailwind CSS
- **Backend**: Next.js API routes handling game logic and score persistence  
- **Game Engine**: Custom TypeScript implementation in `src/helpers/gameLogic.ts`
- **Styling**: Custom 2048-themed Tailwind configuration with authentic colors
- **Score Tracking**: CSV-based persistent score storage system

## Key Components
- `src/app/page.tsx` - Main game interface with board rendering and controls
- `src/helpers/gameLogic.ts` - Core game mechanics (board generation, moves, merging)
- `src/app/api/route.ts` - Game state management API endpoint
- `src/app/api/scores/route.ts` - Score retrieval API
- `src/components/RecentScores.tsx` - Score history display component

## Development Guidelines

### Code Quality Standards
- Use TypeScript strictly with proper type definitions
- Follow Next.js 14 App Router conventions
- Maintain responsive design patterns for mobile and desktop
- Implement proper error handling and user feedback
- Use semantic HTML and accessible design patterns

### Game Logic Principles
- Maintain immutable game state transformations
- Ensure deterministic game behavior
- Implement proper game over detection
- Follow classic 2048 rules for tile generation and merging

### Performance Considerations
- Optimize board rendering for smooth gameplay
- Minimize API calls during gameplay
- Use React hooks efficiently
- Implement proper loading states

### Testing Approach
- Test game logic functions independently
- Verify API endpoint behavior
- Ensure mobile touch controls work properly
- Validate score persistence functionality

## Common Tasks

### Adding New Features
1. Implement game logic changes in `gameLogic.ts` first
2. Update API endpoints if server state changes needed
3. Modify UI components to support new functionality
4. Add appropriate TypeScript types
5. Test across mobile and desktop interfaces

### Styling Updates
- Use existing 2048 color palette defined in `tailwind.config.ts`
- Maintain responsive grid layout for game board
- Follow established spacing and typography patterns
- Ensure mobile-first responsive design

### API Modifications
- Maintain backward compatibility with existing game state structure
- Implement proper error responses
- Update TypeScript interfaces when changing data structures
- Test both success and error scenarios

## Architecture Notes
- Game state is managed server-side to prevent cheating
- Score persistence uses CSV format for simplicity
- Mobile controls use touch-friendly button interface
- Desktop supports keyboard arrow key controls
- Auto-play feature uses random move selection (can be enhanced)

## Security Considerations
- Validate all user inputs in API routes
- Sanitize score data before persistence
- Implement rate limiting for API endpoints if needed
- Ensure no sensitive data exposure in client-side code

## Known Technical Debt
- TypeScript version compatibility warning (5.5.3 vs supported <5.5.0)
- Basic "best move" algorithm needs enhancement for true AI
- Font loading issues in build process (Google Fonts dependency)
- Limited error handling for network failures

When working on this repository, prioritize maintaining the classic 2048 gameplay experience while adding modern web development best practices and responsive design principles.