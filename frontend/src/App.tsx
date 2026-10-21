
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileSearch,
  FileText,
  Filter,
  FolderOpen,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  X,
} from "lucide-react";

type Report = {
  id: number;
  title: string;
  agency: string;
  type: string;
  date: string;
  status: "Indexed" | "Processing" | "Failed";
  version: string;
};

const initialReports: Report[] = [
  {
    id: 1,
    title: "Annual Financial Audit 2026",
    agency: "Finance Department",
    type: "Audit",
    date: "Oct 18, 2026",
    status: "Indexed",
    version: "v2.0",
  },
  {
    id: 2,
    title: "Cybersecurity Risk Assessment",
    agency: "IT Department",
    type: "Assessment",
    date: "Oct 16, 2026",
    status: "Indexed",
    version: "v1.0",
  },
  {
    id: 3,
    title: "Infrastructure Inspection Report",
    agency: "Public Works",
    type: "Inspection",
    date: "Oct 15, 2026",
    status: "Processing",
    version: "v1.0",
  },
  {
    id: 4,
    title: "Data Privacy Compliance Review",
    agency: "IT Department",
    type: "Audit",
    date: "Oct 12, 2026",
    status: "Indexed",
    version: "v3.0",
  },
  {
    id: 5,
    title: "Quarterly Operations Report",
    agency: "Operations",
    type: "Technical",
    date: "Oct 10, 2026",
    status: "Failed",
    version: "v1.0",
  },
];

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Search Reports", icon: FileSearch },
  { label: "All Reports", icon: FolderOpen },
  { label: "Upload Report", icon: Upload },
  { label: "Users & Roles", icon: Users },
  { label: "Audit Logs", icon: ShieldCheck },
  { label: "Settings", icon: Settings },
];

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [reports, setReports] = useState(initialReports);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [agency, setAgency] = useState("Finance Department");
  const [type, setType] = useState("Audit");
  const [file, setFile] = useState<File | null>(null);

  const filteredReports = useMemo(
    () =>
      reports.filter((report) => {
        const text =
          `${report.title} ${report.agency} ${report.type}`.toLowerCase();

        const matchesQuery = text.includes(query.toLowerCase());
        const matchesFilter =
          filter === "All" ||
          report.status === filter ||
          report.type === filter;

        return matchesQuery && matchesFilter;
      }),
    [reports, query, filter]
  );

  function navigate(destination: string) {
    setPage(destination);
    setMenuOpen(false);
    setMessage("");
  }

  function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !file) {
      setMessage("Please enter a title and select a document.");
      return;
    }

    const newReport: Report = {
      id: Date.now(),
      title: title.trim(),
      agency,
      type,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: "Processing",
      version: "v1.0",
    };

    setReports((previous) => [newReport, ...previous]);
    setTitle("");
    setFile(null);
    setPage("All Reports");
    setMessage(
      "Report added to the demo. Connect the backend to upload the actual file."
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-800">
      {menuOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
            <BookOpen size={22} />
          </div>
          <div>
            <h2 className="font-bold">ReportWise</h2>
            <p className="text-xs text-slate-400">Intelligent workspace</p>
          </div>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 pt-3 text-[10px] font-bold tracking-widest text-slate-400">
            WORKSPACE
          </p>

          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => navigate(label)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                page === label
                  ? "bg-violet-50 font-semibold text-violet-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Search Reports" && (
                <span className="ml-auto rounded bg-violet-100 px-2 py-0.5 text-[10px] text-violet-700">
                  AI
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="m-4 rounded-2xl bg-violet-50 p-4">
          <Sparkles size={20} className="mb-3 text-violet-600" />
          <h3 className="text-sm font-semibold">Smart discovery</h3>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Find useful information across your reports.
          </p>
          <button
            onClick={() => navigate("Search Reports")}
            className="mt-3 flex items-center gap-1 text-xs font-semibold text-violet-700"
          >
            Start searching <ArrowRight size={14} />
          </button>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
            AS
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Aditi Sharma</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>
            <div>
              <p className="text-xs text-slate-400">Workspace / {page}</p>
              <h1 className="mt-1 font-bold">{page}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs text-emerald-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Demo workspace
            </span>
            <button
              aria-label="Notifications"
              onClick={() => setMessage("You're all caught up!")}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            >
              <Bell size={19} />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
              AS
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1450px] p-4 md:p-8">
          {message && (
            <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-800">
              <span>{message}</span>
              <button
                aria-label="Dismiss message"
                onClick={() => setMessage("")}
              >
                <X size={17} />
              </button>
            </div>
          )}

          {page === "Dashboard" && (
            <>
              <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="mb-2 text-sm text-slate-500">
                    Your document workspace
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Welcome back, Aditi 👋
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Here's what's happening with your reports.
                  </p>
                </div>

                <button
                  onClick={() => navigate("Upload Report")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
                >
                  <Plus size={17} /> Upload new report
                </button>
              </div>

              <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Total reports"
                  value={reports.length}
                  description="Across all agencies"
                  icon={<FileText size={20} />}
                  color="violet"
                />
                <StatCard
                  title="Indexed reports"
                  value={reports.filter((r) => r.status === "Indexed").length}
                  description="Ready for discovery"
                  icon={<CheckCircle2 size={20} />}
                  color="green"
                />
                <StatCard
                  title="Processing"
                  value={
                    reports.filter((r) => r.status === "Processing").length
                  }
                  description="Being prepared"
                  icon={<Activity size={20} />}
                  color="blue"
                />
                <StatCard
                  title="Failed processing"
                  value={reports.filter((r) => r.status === "Failed").length}
                  description="Need attention"
                  icon={<ShieldCheck size={20} />}
                  color="orange"
                />
              </div>

              <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold">Find the right report</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Search by report name, topic or agency
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:border-violet-400">
                  <Search
                    size={19}
                    className="ml-2 mt-2 shrink-0 text-slate-400"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && navigate("Search Reports")
                    }
                    placeholder="e.g. Find cybersecurity audits from 2026..."
                    className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none"
                  />
                  <button
                    onClick={() => navigate("Search Reports")}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Search
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400">Try:</span>
                  {["Financial audit", "Cybersecurity", "IT Department"].map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setQuery(suggestion);
                          setPage("Search Reports");
                        }}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:border-violet-300 hover:text-violet-700"
                      >
                        {suggestion}
                      </button>
                    )
                  )}
                </div>
              </section>

              <section className="mb-7 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-600 p-6 text-white md:p-8">
                <Sparkles size={25} />
                <h3 className="mt-4 text-xl font-bold">
                  Discover more with intelligent search
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-violet-100">
                  Find relevant reports using natural language, metadata
                  filters, and semantic search once the AI backend is connected.
                </p>
                <button
                  onClick={() => navigate("Search Reports")}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                >
                  Explore search <ArrowRight size={16} />
                </button>
              </section>

              <ReportTable
                reports={reports.slice(0, 5)}
                onOpen={(report) =>
                  setMessage(
                    `Selected "${report.title}". Document preview will be available after backend integration.`
                  )
                }
                onViewAll={() => navigate("All Reports")}
              />
            </>
          )}

          {(page === "Search Reports" || page === "All Reports") && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-5 md:p-6">
                <h2 className="text-lg font-bold">
                  {page === "Search Reports"
                    ? "Intelligent report search"
                    : "Your report library"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {page === "Search Reports"
                    ? "Search through report titles and metadata in demo mode."
                    : "Browse all reports available in the demo."}
                </p>

                <div className="mt-5 flex gap-2 rounded-xl border border-slate-200 p-2 focus-within:border-violet-400">
                  <Search size={19} className="ml-2 mt-2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search reports..."
                    className="min-w-0 flex-1 px-1 py-2 text-sm outline-none"
                  />
                  <button
                    onClick={() => {
                      setQuery("");
                      setFilter("All");
                    }}
                    className="rounded-lg px-3 text-xs text-slate-500 hover:bg-slate-100"
                  >
                    Clear
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Filter size={16} className="text-slate-400" />
                  {[
                    "All",
                    "Audit",
                    "Assessment",
                    "Inspection",
                    "Technical",
                    "Indexed",
                    "Processing",
                    "Failed",
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`rounded-full border px-3 py-1.5 text-xs ${
                        filter === item
                          ? "border-violet-600 bg-violet-50 font-semibold text-violet-700"
                          : "border-slate-200 text-slate-500 hover:border-violet-300"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 md:p-6">
                <p className="mb-4 text-xs text-slate-400">
                  {filteredReports.length} report(s) found
                </p>
                <ReportTable
                  reports={filteredReports}
                  onOpen={(report) =>
                    setMessage(`Selected report: ${report.title}`)
                  }
                  onViewAll={() => {
                    setQuery("");
                    setFilter("All");
                  }}
                />
              </div>
            </section>
          )}

          {page === "Upload Report" && (
            <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 md:p-8">
              <div className="mb-7">
                <div className="mb-3 inline-flex rounded-xl bg-violet-100 p-3 text-violet-700">
                  <Upload size={22} />
                </div>
                <h2 className="text-xl font-bold">Upload a new report</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Add the document details to your report library.
                </p>
              </div>

              <form onSubmit={handleUpload} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Report title *
                  </label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Annual Financial Audit 2026"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Agency *
                    </label>
                    <select
                      value={agency}
                      onChange={(e) => setAgency(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                    >
                      {[
                        "Finance Department",
                        "IT Department",
                        "Public Works",
                        "Operations",
                        "Human Resources",
                      ].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Report type *
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                    >
                      {["Audit", "Inspection", "Assessment", "Technical"].map(
                        (item) => (
                          <option key={item}>{item}</option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Report date
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                    <CalendarDays size={18} className="text-slate-400" />
                    <input
                      type="date"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Document file *
                  </label>
                  <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-200 px-5 py-8 text-center hover:border-violet-400 hover:bg-violet-50/50">
                    <Upload size={24} className="mb-3 text-violet-600" />
                    <span className="text-sm font-semibold">
                      {file ? file.name : "Click to select a document"}
                    </span>
                    <span className="mt-2 text-xs text-slate-400">
                      PDF or DOCX
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={(e) =>
                        setFile(e.target.files?.[0] ?? null)
                      }
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-5">
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    <Upload size={16} /> Add report
                  </button>
                </div>
              </form>
            </section>
          )}

          {page === "Users & Roles" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold">Users & Roles</h2>
              <p className="mt-2 text-sm text-slate-500">
                Demo user list. Real user management requires backend APIs.
              </p>
              {[
                ["AS", "Aditi Sharma", "Administrator"],
                ["RM", "Rohan Mehta", "Uploader"],
                ["NP", "Neha Patel", "Viewer"],
              ].map(([initials, name, role]) => (
                <div
                  key={name}
                  className="mt-4 flex items-center gap-3 rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                    {initials}
                  </div>
                  <span className="flex-1 text-sm font-semibold">{name}</span>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs text-violet-700">
                    {role}
                  </span>
                </div>
              ))}
            </section>
          )}

          {page === "Audit Logs" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold">Audit Logs</h2>
              <p className="mt-2 text-sm text-slate-500">
                Sample activity. Real audit records must come from the backend.
              </p>
              {[
                "Report library opened",
                "Search page visited",
                "Dashboard viewed",
              ].map((activity) => (
                <div
                  key={activity}
                  className="mt-4 flex items-center gap-3 border-b border-slate-100 pb-4"
                >
                  <ShieldCheck size={19} className="text-violet-600" />
                  <span className="text-sm">{activity}</span>
                </div>
              ))}
            </section>
          )}

          {page === "Settings" && (
            <section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold">Settings</h2>
              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold">Workspace</p>
                <p className="mt-2 text-sm text-slate-500">
                  ReportWise demo workspace
                </p>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold">Authentication</p>
                <p className="mt-2 text-sm text-slate-500">
                  Connect the FastAPI backend to enable secure login and
                  permissions.
                </p>
              </div>
            </section>
          )}
        </div>

        <footer className="border-t border-slate-200 bg-white px-5 py-5 text-center text-xs text-slate-400">
          ReportWise · Intelligent Report Management System
        </footer>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  color,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colors: Record<string, string> = {
    violet: "bg-violet-50 text-violet-700",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={`rounded-xl p-2.5 ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function ReportTable({
  reports,
  onOpen,
  onViewAll,
}: {
  reports: Report[];
  onOpen: (report: Report) => void;
  onViewAll: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h3 className="font-bold">Recent reports</h3>
          <p className="mt-1 text-xs text-slate-400">
            Documents in your workspace
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900"
        >
          View all <ArrowRight size={14} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-5 py-4">Report</th>
              <th className="px-4 py-4">Agency</th>
              <th className="px-4 py-4">Date</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Version</th>
              <th className="px-4 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="max-w-[230px] truncate text-sm font-semibold">
                        {report.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {report.type}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-xs text-slate-500">
                  {report.agency}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                  {report.date}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={report.status} />
                </td>
                <td className="px-4 py-4 text-xs text-slate-500">
                  {report.version}
                </td>
                <td className="px-4 py-4">
                  <button
                    title="View report"
                    onClick={() => onOpen(report)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <ArrowRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reports.length === 0 && (
        <div className="p-10 text-center text-sm text-slate-400">
          No reports found. Try a different search or filter.
        </div>
      )}

      <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
        Showing {reports.length} report(s)
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: Report["status"] }) {
  const styles = {
    Indexed: "bg-emerald-50 text-emerald-700",
    Processing: "bg-amber-50 text-amber-700",
    Failed: "bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "Indexed"
            ? "bg-emerald-500"
            : status === "Processing"
              ? "bg-amber-500"
              : "bg-rose-500"
        }`}
      />
      {status}
    </span>
  );
}