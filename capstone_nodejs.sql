CREATE TABLE IF NOT EXISTS users (
	id INT PRIMARY KEY AUTO_INCREMENT,
	email VARCHAR(255) NOT NULL UNIQUE,
	`name` VARCHAR(255),
	`password` VARCHAR(255),
	phone VARCHAR(255),
	birthday DATE,
	gender ENUM('Male', 'Female'),
	`role` ENUM('SuperAdmin', 'Admin', 'User') NOT NULL DEFAULT 'User',
	account_status ENUM('Active', 'Suspended', 'Banned') NOT NULL DEFAULT 'Active',
	avatar TEXT,
	avatar_public_id VARCHAR(255),
	google_id VARCHAR(255) UNIQUE,
	skill VARCHAR(255),
	certification VARCHAR(255),
 
	`deleted_by` INT NULL DEFAULT NULL,
	`is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
	`deleted_at` TIMESTAMP NULL DEFAULT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
	CONSTRAINT fk_users_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id)
);
 
CREATE TABLE IF NOT EXISTS categories (
	id INT PRIMARY KEY AUTO_INCREMENT,
	`name` VARCHAR(255) NOT NULL,
 
	`deleted_by` INT NULL DEFAULT NULL,
	`is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
	`deleted_at` TIMESTAMP NULL DEFAULT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
	CONSTRAINT fk_categories_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id)
);
 
CREATE TABLE IF NOT EXISTS subcategory_groups (
	id INT PRIMARY KEY AUTO_INCREMENT,
	`name` VARCHAR(255) NOT NULL,
	category_id INT NOT NULL,
 
	`deleted_by` INT NULL DEFAULT NULL,
	`is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
	`deleted_at` TIMESTAMP NULL DEFAULT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
	CONSTRAINT fk_subcategory_groups_category FOREIGN KEY (category_id) REFERENCES categories (id),
	CONSTRAINT fk_subcategory_groups_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id)
);
 
CREATE TABLE IF NOT EXISTS subcategories (
	id INT PRIMARY KEY AUTO_INCREMENT,
	`name` VARCHAR(255) NOT NULL,
	subcategory_group_id INT NOT NULL,
 
	`deleted_by` INT NULL DEFAULT NULL,
	`is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
	`deleted_at` TIMESTAMP NULL DEFAULT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
	CONSTRAINT fk_subcategories_group FOREIGN KEY (subcategory_group_id) REFERENCES subcategory_groups (id),
	CONSTRAINT fk_subcategories_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id)
);
 
CREATE TABLE IF NOT EXISTS gigs (
	id INT PRIMARY KEY AUTO_INCREMENT,
	title VARCHAR(255) NOT NULL,
	price INT UNSIGNED NOT NULL,
	rating DECIMAL(3, 2) NOT NULL DEFAULT 0,
	review INT UNSIGNED NOT NULL DEFAULT 0,
	image TEXT,
	image_public_id VARCHAR(255),
	description TEXT,
	short_description VARCHAR(255),
	subcategory_id INT NOT NULL,
	seller_id INT NOT NULL,
	moderation_status ENUM('Active', 'UnderReview', 'Hidden') NOT NULL DEFAULT 'Active',
 
	`deleted_by` INT NULL DEFAULT NULL,
	`is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
	`deleted_at` TIMESTAMP NULL DEFAULT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
	CONSTRAINT fk_gigs_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories (id),
	CONSTRAINT fk_gigs_seller FOREIGN KEY (seller_id) REFERENCES users (id),
	CONSTRAINT fk_gigs_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id)
);
 
CREATE TABLE IF NOT EXISTS orders (
	id INT PRIMARY KEY AUTO_INCREMENT,
	gig_id INT NOT NULL,
	buyer_id INT NOT NULL,
	price INT UNSIGNED NOT NULL,
	ordered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	status ENUM('Pending', 'InProgress', 'Cancelled', 'Completed') NOT NULL DEFAULT 'Pending',
 
	`deleted_by` INT NULL DEFAULT NULL,
	`is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
	`deleted_at` TIMESTAMP NULL DEFAULT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
	CONSTRAINT fk_orders_gig FOREIGN KEY (gig_id) REFERENCES gigs (id),
	CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES users (id),
	CONSTRAINT fk_orders_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id)
);
 
CREATE TABLE IF NOT EXISTS reviews (
	id INT PRIMARY KEY AUTO_INCREMENT,
	gig_id INT NOT NULL,
	user_id INT NOT NULL,
	order_id INT NOT NULL UNIQUE,
	`content` TEXT,
	rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
	moderation_status ENUM('Active', 'UnderReview', 'Hidden') NOT NULL DEFAULT 'Active',
 
	`deleted_by` INT NULL DEFAULT NULL,
	`is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
	`deleted_at` TIMESTAMP NULL DEFAULT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
	CONSTRAINT fk_reviews_gig FOREIGN KEY (gig_id) REFERENCES gigs (id),
	CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id),
	CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders (id),
	CONSTRAINT fk_reviews_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS reports (
	id INT PRIMARY KEY AUTO_INCREMENT,
	reporter_id INT NOT NULL,
	gig_id INT NULL DEFAULT NULL,
	review_id INT NULL DEFAULT NULL,
	reported_user_id INT NULL DEFAULT NULL,
 
	reason ENUM('Spam', 'Inappropriate', 'Scam', 'Fake', 'Copyright', 'Other') NOT NULL,
	description TEXT,
 
	status ENUM('Pending', 'Reviewing', 'Resolved', 'Rejected') NOT NULL DEFAULT 'Pending',
	handled_by INT NULL DEFAULT NULL,
	handled_at TIMESTAMP NULL DEFAULT NULL,
	resolution_note TEXT,
 
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
	CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users (id),
	CONSTRAINT fk_reports_gig FOREIGN KEY (gig_id) REFERENCES gigs (id),
	CONSTRAINT fk_reports_review FOREIGN KEY (review_id) REFERENCES reviews (id),
	CONSTRAINT fk_reports_reported_user FOREIGN KEY (reported_user_id) REFERENCES users (id),
	CONSTRAINT fk_reports_handled_by FOREIGN KEY (handled_by) REFERENCES users (id),
 
	CONSTRAINT chk_reports_one_target CHECK (
		(gig_id IS NOT NULL) + (review_id IS NOT NULL) + (reported_user_id IS NOT NULL) = 1
	),
 
	CONSTRAINT uq_reports_reporter_gig UNIQUE (reporter_id, gig_id),
	CONSTRAINT uq_reports_reporter_review UNIQUE (reporter_id, review_id),
	CONSTRAINT uq_reports_reporter_user UNIQUE (reporter_id, reported_user_id),
 
	INDEX idx_reports_status (status, created_at)
);

INSERT INTO users (id, email, name, password, role, account_status) VALUES
(1, 'sa.test@gmail.com',     'Super Admin Test', '$2b$10$IXlESTAgGMB5D2XYHOsxOerF1Ka7QehS9suMm3OakgEKcTGetjR3q', 'SuperAdmin', 'Active'),
(2, 'seller.demo@gmail.com', 'Demo Seller',      '$2b$10$IXlESTAgGMB5D2XYHOsxOerF1Ka7QehS9suMm3OakgEKcTGetjR3q', 'User',       'Active'),
(3, 'admin.test@gmail.com',  'Admin Test',       '$2b$10$IXlESTAgGMB5D2XYHOsxOerF1Ka7QehS9suMm3OakgEKcTGetjR3q', 'Admin',      'Active'),
(4, 'user.test@gmail.com',   'User Test',        '$2b$10$IXlESTAgGMB5D2XYHOsxOerF1Ka7QehS9suMm3OakgEKcTGetjR3q', 'User',       'Active');

INSERT INTO categories (id, name) VALUES
(1, 'Graphics & Design'),
(2, 'Programming & Tech'),
(3, 'Digital Marketing'),
(4, 'Writing & Translation'),
(5, 'Video & Animation');

INSERT INTO subcategory_groups (id, name, category_id) VALUES
(1, 'Logo & Brand Identity', 1),
(2, 'Web & App Design', 1),
(3, 'Website Development', 2),
(4, 'Website Maintenance', 2),
(5, 'Social Media Marketing', 3),
(6, 'SEO', 3),
(7, 'Content Writing', 4),
(8, 'Translation', 4),
(9, 'Video Editing', 5),
(10, 'Animation', 5);

INSERT INTO subcategories (id, name, subcategory_group_id) VALUES
(1, 'Logo Design', 1),
(2, 'Brand Style Guides', 1),
(3, 'Website Design', 2),
(4, 'App Design', 2),
(5, 'Frontend Development', 3),
(6, 'Backend Development', 3),
(7, 'Bug Fixes', 4),
(8, 'Website Optimization', 4),
(9, 'Social Media Management', 5),
(10, 'Social Media Advertising', 5),
(11, 'SEO Strategy', 6),
(12, 'On-Page SEO', 6),
(13, 'Blog Writing', 7),
(14, 'Product Descriptions', 7),
(15, 'English Translation', 8),
(16, 'Vietnamese Translation', 8),
(17, 'YouTube Video Editing', 9),
(18, 'Short Video Editing', 9),
(19, '2D Animation', 10),
(20, 'Logo Animation', 10);

INSERT INTO gigs (
    id, title, price, rating, review,
    image, description, short_description,
    subcategory_id, seller_id, moderation_status
) VALUES
(
    1, 'I will design a modern minimalist logo',
    500000, 4.80, 5,
    'https://placehold.co/600x400?text=Logo+Design',
    'I will create a clean and memorable logo for your brand.',
    'Modern minimalist logo design.',
    1, 4, 'Active'
),
(
    2, 'I will design a professional brand identity',
    1200000, 5.00, 3,
    'https://placehold.co/600x400?text=Brand+Identity',
    'I will design a consistent visual identity for your business.',
    'Complete visual identity for your brand.',
    2, 4, 'Active'
),
(
    3, 'I will build a responsive frontend website',
    2000000, 4.50, 4,
    'https://placehold.co/600x400?text=Frontend',
    'I will develop a responsive website using modern frontend technologies.',
    'Responsive frontend website development.',
    5, 4, 'Active'
),
(
    4, 'I will develop a REST API for your application',
    3000000, 4.75, 4,
    'https://placehold.co/600x400?text=Backend+API',
    'I will build a REST API with authentication and database integration.',
    'Backend API development.',
    6, 4, 'Active'
),
(
    5, 'I will fix bugs on your website',
    400000, 4.00, 2,
    'https://placehold.co/600x400?text=Bug+Fixes',
    'I will help identify and fix common website issues.',
    'Website bug fixing service.',
    7, 4, 'Active'
),
(
    6, 'I will manage your social media accounts',
    1500000, 4.60, 5,
    'https://placehold.co/600x400?text=Social+Media',
    'I will help manage your social media content and posting schedule.',
    'Social media management service.',
    9, 2, 'Active'
),
(
    7, 'I will improve your website on-page SEO',
    1000000, 4.25, 4,
    'https://placehold.co/600x400?text=SEO',
    'I will review and optimize on-page SEO elements.',
    'On-page SEO optimization.',
    12, 2, 'Active'
),
(
    8, 'I will write engaging blog articles',
    350000, 0.00, 0,
    'https://placehold.co/600x400?text=Blog+Writing',
    'I will write clear and engaging articles for your target audience.',
    'Blog writing for websites.',
    13, 2, 'Active'
),
(
    9, 'I will edit professional YouTube videos',
    800000, 4.90, 10,
    'https://placehold.co/600x400?text=Video+Editing',
    'I will edit YouTube videos with transitions, captions and audio cleanup.',
    'Professional YouTube video editing.',
    17, 4, 'UnderReview'
),
(
    10, 'I will create a 2D animated logo',
    900000, 0.00, 0,
    'https://placehold.co/600x400?text=Logo+Animation',
    'I will create a simple and engaging 2D logo animation.',
    '2D logo animation service.',
    20, 2, 'Hidden'
);

INSERT INTO orders (id, gig_id, buyer_id, price, ordered_at, status) VALUES
(1, 1, 2, 500000,  '2026-10-01 09:00:00', 'Completed'),
(2, 2, 2, 1200000, '2026-10-02 10:00:00', 'Completed'),
(3, 3, 2, 2000000, '2026-10-03 11:00:00', 'Completed'),
(4, 4, 2, 3000000, '2026-10-04 12:00:00', 'Completed'),
(5, 6, 4, 1500000, '2026-10-05 13:00:00', 'Completed'),
(6, 7, 4, 1000000, '2026-10-06 14:00:00', 'Completed'),
(7, 5, 2, 400000,  '2026-10-26 09:00:00', 'Pending'),
(8, 8, 4, 350000,  '2026-10-26 10:00:00', 'InProgress'),
(9, 9, 2, 800000,  '2026-10-26 11:00:00', 'Cancelled'),
(10, 1, 2, 500000, '2026-10-27 09:00:00', 'Completed');

INSERT INTO reviews (
    id, gig_id, user_id, order_id,
    content, rating, moderation_status
) VALUES
(
    1, 1, 2, 1,
    'Great logo design and fast delivery.',
    5, 'Active'
),
(
    2, 2, 2, 2,
    'The brand identity looks professional.',
    5, 'Active'
),
(
    3, 3, 2, 3,
    'The website is responsive and works well.',
    4, 'Active'
),
(
    4, 4, 2, 4,
    'The API works as expected.',
    5, 'UnderReview'
),
(
    5, 6, 4, 5,
    'Good communication and useful content.',
    4, 'Active'
);

INSERT INTO reports (
    id, reporter_id, gig_id, review_id, reported_user_id,
    reason, description, status, handled_by, handled_at, resolution_note
) VALUES
(
    1, 2, 9, NULL, NULL,
    'Copyright',
    'The gig may contain copyrighted material.',
    'Pending', NULL, NULL, NULL
),
(
    2, 4, NULL, 4, NULL,
    'Inappropriate',
    'Please review the content of this review.',
    'Reviewing', 3, NULL, NULL
),
(
    3, 2, NULL, NULL, 4,
    'Scam',
    'I want the administration to review this account.',
    'Resolved', 1, '2026-10-26 15:00:00',
    'The report has been reviewed.'
),
(
    4, 4, 10, NULL, NULL,
    'Spam',
    'The gig may contain spam content.',
    'Rejected', 3, '2026-10-27 10:00:00',
    'No violation was found.'
);

UPDATE gigs g SET
  rating = COALESCE((SELECT ROUND(AVG(r.rating), 2) FROM reviews r
    WHERE r.gig_id = g.id AND r.is_deleted = 0 AND r.moderation_status = 'Active'), 0),
  review = (SELECT COUNT(*) FROM reviews r
    WHERE r.gig_id = g.id AND r.is_deleted = 0 AND r.moderation_status = 'Active');