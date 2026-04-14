import dotenv from "dotenv";
dotenv.config();
import connectDB from "../config/database.js";
import Job from "../models/Job.js";

async function checkAndCreateJobs() {
  try {
    await connectDB();
    
    // Check existing jobs
    const allJobs = await Job.find({});
    console.log(`\n📊 Total jobs in database: ${allJobs.length}`);
    
    if (allJobs.length > 0) {
      console.log("\n📋 Existing Jobs:");
      allJobs.forEach(job => {
        console.log(`  - ${job.title} at ${job.company} (Active: ${job.isActive})`);
      });
    }
    
    // Check active jobs
    const activeJobs = await Job.find({ isActive: true });
    console.log(`\n✅ Active jobs: ${activeJobs.length}`);
    
    if (activeJobs.length === 0) {
      console.log("\n⚠️ No active jobs found! Creating sample jobs...");
      
      const sampleJobs = [
        {
          title: "Frontend Developer",
          company: "Tech Solutions Inc.",
          description: "Looking for a Frontend Developer with React experience. You'll be building modern web applications using React, Redux, and Tailwind CSS.",
          location: "Remote",
          experienceLevel: "Junior",
          employmentType: "Full-time",
          skills: ["React", "JavaScript", "HTML5", "CSS3", "Redux"],
          isActive: true,
        },
        {
          title: "Backend Developer",
          company: "Digital Innovations",
          description: "Seeking a Backend Developer proficient in Node.js and Express. Will work on REST APIs and database integration.",
          location: "Manila",
          experienceLevel: "Mid-Level",
          employmentType: "Full-time",
          skills: ["Node.js", "Express.js", "MongoDB", "REST API", "Postman"],
          isActive: true,
        },
        {
          title: "Full Stack Developer",
          company: "Creative Web Studio",
          description: "Looking for a Full Stack Developer with MERN stack experience. Must have experience with React and Node.js.",
          location: "Remote",
          experienceLevel: "Senior",
          employmentType: "Remote",
          skills: ["React", "Node.js", "Express.js", "MongoDB", "TypeScript"],
          isActive: true,
        },
        {
          title: "DevOps Engineer",
          company: "Cloud Solutions Co.",
          description: "Seeking DevOps Engineer with AWS and Docker experience. Will manage cloud infrastructure and CI/CD pipelines.",
          location: "Remote",
          experienceLevel: "Senior",
          employmentType: "Remote",
          skills: ["AWS", "Docker", "Kubernetes", "Jenkins", "Linux"],
          isActive: true,
        },
        {
          title: "Mobile Developer",
          company: "App Studio",
          description: "Looking for React Native developer to build cross-platform mobile applications.",
          location: "Cebu",
          experienceLevel: "Junior",
          employmentType: "Full-time",
          skills: ["React Native", "JavaScript", "Redux", "Firebase"],
          isActive: true,
        },
      ];
      
      for (const jobData of sampleJobs) {
        const job = new Job(jobData);
        await job.save();
        console.log(`  ✅ Created: ${job.title} at ${job.company}`);
      }
      
      console.log(`\n✅ Created ${sampleJobs.length} sample jobs!`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkAndCreateJobs();