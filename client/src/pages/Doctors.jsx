const Doctors = () => {
  return (
    <div className="container mx-auto px-4 pt-36 pb-16">
      {/* <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
        Find Your Doctor
      </h1> */}
      <div className="max-w-3xl mx-auto">
        <p className="text-gray-600 text-center mb-8">
          Connect with experienced mental health professionals who can help you
          on your journey to better mental well-being.
        </p>
        {/* Doctor list will be implemented later */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-500 text-center">
              Doctor listings coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Doctors;
