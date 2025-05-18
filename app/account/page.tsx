import AccountContent from "./components/AccountContent";

const Account = () => {
  return (
    <div className="bg-[#0d0d0d] rounded-lg w-full h-full overflow-hidden ">
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="px-6 py-8 md:px-10 space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient">
            アカウント設定
          </h1>
          <AccountContent />
        </div>
      </div>
    </div>
  );
};

export default Account;
