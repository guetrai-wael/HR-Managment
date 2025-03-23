import { FC } from "react";
import { Link } from "react-router-dom";
import Logo from "../../../assets/icons/logo.svg";
import stars from "../../../assets/img/Stars.png";
import { FormContainerProps } from "../../../types";

/**
 * FormContainer - A layout component for authentication pages
 */
const FormContainer: FC<FormContainerProps> = ({
  title,
  subtitle,
  children,
  actionLinkText,
  actionLinkLabel,
  actionLinkTo,
  backgroundImage,
  infoHeading,
  infoText,
}) => {
  // Style for the right panel with dynamic background image
  const infoSectionStyle = {
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Form Section - takes full width on mobile, half width on desktop */}
      <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col items-center justify-center overflow-auto">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center justify-center ">
            <img src={Logo} alt="Logo" className="w-16 h-16" />
          </div>

          {/* Title and subtitle */}
          <h2 className="text-2xl md:text-3xl font-semibold mb-2">{title}</h2>
          <p className="text-gray-600 mb-4">{subtitle}</p>

          {/* Form content (children prop) */}
          {children}

          {/* Action link (Sign up / Log in) */}
          <div className="text-center mt-4">
            <span className="text-gray-600">
              {actionLinkText}
              <Link
                to={actionLinkTo}
                className="text-[#7c3aed] hover:text-[#6d28d9] font-medium hover:underline transition-colors duration-200"
              >
                {actionLinkLabel}
              </Link>
            </span>
          </div>
        </div>
      </div>

      {/* Info Section - hidden on mobile, visible on medium screens and up */}
      <div
        className="hidden md:flex w-1/2 items-center justify-center p-8 relative"
        style={infoSectionStyle}
      >
        {/* Overlay for better text visibility */}
        <div className="absolute inset-0 bg-black opacity-50"></div>

        {/* Content container for the right panel */}
        <div className="text-start z-10 relative max-w-md w-full">
          {/* Icon */}
          <div className="mb-8 flex items-start">
            <img src={stars} alt="Icon" className="w-16 h-16" />
          </div>

          {/* Info text content */}
          <h1 className="text-2xl font-semibold mb-6 text-white">
            {infoHeading}
          </h1>
          <p className="text-gray-100 mb-8">{infoText}</p>

          {/* Avatar placeholders and user count */}
          <div className="flex items-center mt-8">
            <div className="flex -space-x-4">
              <div className="w-10 h-10 rounded-full bg-blue-400 z-30 ring-2 ring-white"></div>
              <div className="w-10 h-10 rounded-full bg-purple-400 z-20 ring-2 ring-white"></div>
              <div className="w-10 h-10 rounded-full bg-green-400 z-10 ring-2 ring-white"></div>
              <div className="w-10 h-10 rounded-full bg-yellow-400 z-0 ring-2 ring-white"></div>
            </div>
            <span className="text-white text-[14px] ml-4">
              Join 40,000+ users
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormContainer;
