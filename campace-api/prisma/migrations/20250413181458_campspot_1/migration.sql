/*
  Warnings:

  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `user` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    DROP COLUMN `name`,
    ADD COLUMN `date_joind` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `user_name` VARCHAR(255) NOT NULL,
    ADD PRIMARY KEY (`user_id`);

-- CreateTable
CREATE TABLE `Campspot` (
    `campspot_id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `location_id` INTEGER NOT NULL,
    `price_per_night` INTEGER NOT NULL,
    `capacity` INTEGER NOT NULL,

    INDEX `Campspot_owner_id_idx`(`owner_id`),
    INDEX `Campspot_location_id_idx`(`location_id`),
    UNIQUE INDEX `Campspot_name_location_id_key`(`name`, `location_id`),
    PRIMARY KEY (`campspot_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CampspotAmenity` (
    `amenity_id` INTEGER NOT NULL AUTO_INCREMENT,
    `campspot_id` INTEGER NOT NULL,
    `amenity_name` VARCHAR(255) NOT NULL,

    INDEX `CampspotAmenity_amenity_name_idx`(`amenity_name`),
    UNIQUE INDEX `CampspotAmenity_campspot_id_amenity_name_key`(`campspot_id`, `amenity_name`),
    PRIMARY KEY (`amenity_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Location` (
    `location_id` INTEGER NOT NULL AUTO_INCREMENT,
    `address` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `province_or_state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NOT NULL,
    `postal_code` INTEGER NOT NULL,

    INDEX `Location_city_country_idx`(`city`, `country`),
    PRIMARY KEY (`location_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Booking` (
    `booking_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `campspot_id` INTEGER NOT NULL,
    `booking_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `total_price` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',

    INDEX `Booking_campspot_id_idx`(`campspot_id`),
    INDEX `Booking_status_idx`(`status`),
    INDEX `Booking_startDate_endDate_idx`(`startDate`, `endDate`),
    UNIQUE INDEX `Booking_campspot_id_startDate_endDate_key`(`campspot_id`, `startDate`, `endDate`),
    PRIMARY KEY (`booking_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `review_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `campspot_id` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL,
    `date_posted` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Review_user_id_campspot_id_key`(`user_id`, `campspot_id`),
    PRIMARY KEY (`review_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Campspot` ADD CONSTRAINT `Campspot_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Campspot` ADD CONSTRAINT `Campspot_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `Location`(`location_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampspotAmenity` ADD CONSTRAINT `CampspotAmenity_campspot_id_fkey` FOREIGN KEY (`campspot_id`) REFERENCES `Campspot`(`campspot_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_campspot_id_fkey` FOREIGN KEY (`campspot_id`) REFERENCES `Campspot`(`campspot_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_campspot_id_fkey` FOREIGN KEY (`campspot_id`) REFERENCES `Campspot`(`campspot_id`) ON DELETE CASCADE ON UPDATE CASCADE;
