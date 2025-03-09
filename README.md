# CampusCloset - Clothing Rental Platform

CampusCloset is a peer-to-peer clothing rental platform designed specifically for college students. It allows students to rent out their clothing items to other students on campus, making fashion more accessible and sustainable.

## Features

- User authentication with college email verification
- Listing management for clothing items
- Booking system for rentals
- Review and rating system
- Image upload with Cloudinary
- Secure payment processing

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Image Storage**: Cloudinary
- **Validation**: Express Validator

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- Cloudinary account for image storage

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/campuscloset.git
   cd campuscloset
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/campuscloset
   JWT_SECRET=your_super_secret_key_change_this_in_production
   JWT_EXPIRE=7d
   NODE_ENV=development

   # Cloudinary Credentials
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:resetToken` - Reset password

### User Endpoints

- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change password

### Listing Endpoints

- `GET /api/listings` - Get all listings
- `GET /api/listings/:id` - Get a single listing
- `POST /api/listings` - Create a new listing
- `PUT /api/listings/:id` - Update a listing
- `DELETE /api/listings/:id` - Delete a listing
- `GET /api/listings/my/listings` - Get current user's listings

### Booking Endpoints

- `GET /api/bookings` - Get all bookings for current user
- `GET /api/bookings/:id` - Get a single booking
- `POST /api/bookings` - Create a new booking
- `PATCH /api/bookings/:id/status` - Update booking status

### Review Endpoints

- `GET /api/reviews/user/:userId` - Get reviews for a user
- `GET /api/reviews/listing/:listingId` - Get reviews for a listing
- `POST /api/reviews` - Create a review
- `PUT /api/reviews/:id` - Update a review
- `DELETE /api/reviews/:id` - Delete a review

### Upload Endpoints

- `POST /api/upload/single` - Upload a single image
- `POST /api/upload/multiple` - Upload multiple images

## License

This project is licensed under the ISC License.
