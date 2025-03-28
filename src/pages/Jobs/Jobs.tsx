import { PlusOutlined } from "@ant-design/icons";
import { Header, SectionHeader, JobCard } from "../../components/common/index";

const Jobs = () => {
  // Sample job data with added deadlines
  const featuredJobs = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      description:
        "We're looking for a senior frontend developer with 5+ years of experience in React, TypeScript, and modern web technologies.",
      status: "Featured",
      icon: "featured",
      deadline: "2025-04-15", // String date format: ~2 weeks away
    },
    {
      id: 2,
      title: "UX/UI Designer",
      description:
        "Join our design team to create beautiful, intuitive interfaces for our enterprise products. Experience with Figma required.",
      status: "Open",
      icon: "star",
      deadline: "2025-03-28", // Date object: 3 days from now
    },
    {
      id: 3,
      title: "Full Stack Engineer",
      description:
        "Work on cutting-edge projects using React, Node.js, and AWS. Remote position available with competitive salary.",
      status: "New",
      icon: "hot",
      deadline: "2025-05-01", // String date format: ~1 month away
    },
  ];

  const handleViewJob = (id: number) => {
    console.log("View job details for:", id);
  };

  const handleApplyJob = (id: number) => {
    console.log("Applied for job:", id);
    // Implement application logic here
  };

  const handleEditJob = (id: number) => {
    console.log("Edit job:", id);
    // Open edit form/modal
  };

  const handleDeleteJob = (id: number) => {
    console.log("Delete job:", id);
    // Show confirmation dialog before deletion
  };

  // Determine if user is admin (temporary implementation)
  // In the future, you can replace this with actual role check
  const isAdmin = true; // For testing - set to false for regular user view

  return (
    <div className="flex flex-col h-full overflow-auto py-4">
      <div className="px-4 md:px-8 mb-6">
        <Header title="Jobs" />
      </div>

      <div className="px-4 md:px-8 space-y-10">
        {/* Featured Jobs Section */}

        <SectionHeader
          title="Featured Jobs"
          subtitle="Apply to jobs that match your skills and experience"
          tabs={[
            { key: "all", label: "All" },
            { key: "it", label: "IT" },
            { key: "business", label: "Business" },
            { key: "design", label: "Design" },
          ]}
          defaultActiveTab="all"
          actionButton={
            isAdmin
              ? {
                  icon: <PlusOutlined />,
                  label: "Add Job",
                  onClick: () => console.log("Add job clicked"),
                }
              : undefined
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
          {featuredJobs.map((job) => (
            <JobCard
              key={job.id}
              title={job.title}
              description={job.description}
              status={job.status}
              icon={job.icon as any}
              deadline={job.deadline}
              onActionClick={() => handleViewJob(job.id)}
              // New props
              onApplyClick={() => handleApplyJob(job.id)}
              onEditClick={() => handleEditJob(job.id)}
              onDeleteClick={() => handleDeleteJob(job.id)}
              // Show edit/delete only for admins
              showApplyButton={true} // Everyone can apply
              showEditButton={isAdmin} // Only admins can edit
              showDeleteButton={isAdmin} // Only admins can delete
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
