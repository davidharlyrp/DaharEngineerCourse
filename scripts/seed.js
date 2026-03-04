import PocketBase from 'pocketbase';

// Configuration
const pb = new PocketBase('https://pb.daharengineer.com');

// Replace with your admin credentials or run with a valid auth token
const ADMIN_EMAIL = 'admin@daharengineer.com';
const ADMIN_PASSWORD = 'D27h03R00p';

async function seed() {
    try {
        // 1. Authenticate as Admin (Superuser in v0.23+)
        console.log('Authenticating...');
        try {
            // For PocketBase v0.23+
            await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        } catch (e) {
            // Fallback for older versions
            await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        }
        console.log('Authenticated successfully!');

        // 2. Create/Find Mentor
        console.log('Creating Mentor...');
        const mentor = await pb.collection('mentor').create({
            name: 'David Harly',
            specialization: 'Geotechnical Engineer & Software Developer',
            email: 'david@daharengineer.com',
            isActive: true,
        });

        const courses = [
            {
                title: 'Mastering Plaxis 2D for Geotechnical Engineering',
                slug: 'mastering-plaxis-2d',
                description: 'Learn how to perform advanced geotechnical numerical analysis using Plaxis 2D from scratch.',
                instructor: mentor.id,
                duration: '12 Hours',
                level: 'intermediate',
                totalModules: 2,
                totalSteps: 4,
                price: 1500000,
                modules: [
                    {
                        title: 'Basics of Finite Element Method',
                        description: 'Introduction to numerical modeling concepts.',
                        order: 1,
                        steps: [
                            {
                                title: 'Introduction to Plaxis 2D Interface',
                                content: '<h1>Getting Started</h1><p>Learn the main tools and components of Plaxis 2D.</p>',
                                order: 1,
                                type: 'text',
                            },
                            {
                                title: 'Material Modeling Fundamentals',
                                content: '<h1>Soil Models</h1><p>Understand Mohr-Coulomb vs Hardening Soil models.</p>',
                                order: 2,
                                type: 'video',
                                videoUrl: 'https://youtube.com/example-video-1',
                            },
                        ],
                    },
                    {
                        title: 'Advanced Excavation Analysis',
                        description: 'Complex deep excavation modeling steps.',
                        order: 2,
                        steps: [
                            {
                                title: 'Defining Water Conditions',
                                content: '<h1>Groundwater Modeling</h1><p>How to set phreatic levels in Plaxis.</p>',
                                order: 1,
                                type: 'text',
                            },
                            {
                                title: 'Phased Construction Settings',
                                content: '<h1>Staged Construction</h1><p>Properly setting up calculation phases.</p>',
                                order: 2,
                                type: 'assignment',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Building Interactive Tools with Python',
                slug: 'python-for-engineers',
                description: 'Complete guide to creating professional engineering tools using Python and modern UI frameworks.',
                instructor: mentor.id,
                duration: '8 Hours',
                level: 'beginner',
                totalModules: 2,
                totalSteps: 4,
                price: 850000,
                modules: [
                    {
                        title: 'Python for Engineering Calculations',
                        description: 'Core syntax for numerical processing.',
                        order: 1,
                        steps: [
                            {
                                title: 'Setup Environment with Anaconda',
                                content: '<h1>Installation Guide</h1><p>Setting up your dev environment for engineering.</p>',
                                order: 1,
                                type: 'text',
                            },
                            {
                                title: 'Pandas for Data Analysis',
                                content: '<h1>Handling Soil Data</h1><p>Processing boring logs with Pandas.</p>',
                                order: 2,
                                type: 'video',
                                videoUrl: 'https://youtube.com/example-video-2',
                            },
                        ],
                    },
                    {
                        title: 'Automating Excel Reporting',
                        description: 'Exporting data to professional Excel templates.',
                        order: 2,
                        steps: [
                            {
                                title: 'OpenPyXL Fundamentals',
                                content: '<h1>Excel Automation</h1><p>How to write formulas and styles to Excel cells.</p>',
                                order: 1,
                                type: 'text',
                            },
                            {
                                title: 'Final Project: Auto-Report Generator',
                                content: '<h1>Engineering Report</h1><p>Building a full tool that generates PDF from Excel.</p>',
                                order: 2,
                                type: 'assignment',
                            },
                        ],
                    },
                ],
            },
        ];

        // 3. Create Courses, Modules, and Steps
        for (const courseData of courses) {
            console.log(`Creating Course: ${courseData.title}...`);
            const { modules, ...coursePayload } = courseData;
            const course = await pb.collection('online_courses').create(coursePayload);

            for (const moduleData of modules) {
                console.log(`  Creating Module: ${moduleData.title}...`);
                const { steps, ...modulePayload } = moduleData;
                const moduleRecord = await pb.collection('online_course_modules').create({
                    ...modulePayload,
                    courseId: course.id,
                });

                for (const stepData of steps) {
                    console.log(`    Creating Step: ${stepData.title}...`);
                    await pb.collection('online_course_steps').create({
                        ...stepData,
                        moduleId: moduleRecord.id,
                    });
                }
            }
        }

        console.log('\n✅ Seeding completed successfully!');
        console.log('Note: Please update the ADMIN_EMAIL and ADMIN_PASSWORD in the script before running.');
    } catch (error) {
        console.error('❌ Error during seeding:', error.data || error.message);
    }
}

seed();
