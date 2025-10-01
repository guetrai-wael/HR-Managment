import supabase from "../supabaseClient";
import {
  RecordingResult,
  RecordingDetails,
  EmployeeRecording,
  Person,
  EmployeePresence,
} from "../../types/models";

const DETECTION_API_URL = "http://localhost:8000/api";

export const recordingsService = {
  /**
   * Upload a video recording for processing
   */
  async uploadRecording(formData: FormData): Promise<{ id: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let healthResponse: Response | null = null;

    try {
      // First, check if the Detection API is available
      try {
        healthResponse = await fetch(`${DETECTION_API_URL}/healthchecker`, {
          method: "GET",
          signal: controller.signal,
        });
      } catch (_err) {
        // Ignore fetch errors, we’ll check below
      } finally {
        clearTimeout(timeoutId);
      }

      if (!healthResponse || !healthResponse.ok) {
        throw new Error(
          "Detection service is not available. Please ensure the Detection-2K25 model is running on http://localhost:8000"
        );
      }

      const response = await fetch(
        `${DETECTION_API_URL}/presence/process_video`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`Failed to process video: ${errorText}`);
      }

      const data = await response.json();

      // Validate response data
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error("Invalid response format from detection service");
      }

      // Try to extract file size from the provided FormData (if a File was appended)
      let fileSize: number | null = null;
      try {
        // FormData in browser environments can be iterated to find File objects
        for (const pair of formData.entries()) {
          const val: FormDataEntryValue = pair[1];
          if (val instanceof File && typeof val.size === "number") {
            fileSize = val.size;
            break;
          }
        }
      } catch (_e) {
        // ignore iteration issues in non-browser environments
      }

      // detection API may return duration_seconds
      const durationSeconds: number | null = data.duration_seconds ?? null;

      // Store metadata in Supabase (not the video itself)
      const { data: recordingData, error } = await supabase
        .from("recordings")
        .insert({
          video_name: data.video_file || "unknown_video",
          status: "completed",
          results_json: data.results,
          processed_at: new Date().toISOString(),
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          video_size: fileSize,
          video_duration: durationSeconds,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Failed to save recording metadata: ${error.message}`);
      }

      return { id: recordingData.id };
    } catch (error) {
      console.error("Error uploading recording:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("Detection service")) {
          throw error; // Re-throw detection service errors as-is
        } else if (error.message.includes("Failed to save")) {
          throw error; // Re-throw database errors as-is
        } else if (error.message.includes("Failed to process")) {
          throw error; // Re-throw processing errors as-is
        }
      }

      // Generic fallback error
      throw new Error(
        "An unexpected error occurred during video upload. Please try again."
      );
    }
  },

  /**
   * Get all recordings
   */
  async getRecordings(): Promise<RecordingResult[]> {
    try {
      const { data, error } = await supabase
        .from("recordings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data as RecordingResult[];
    } catch (error) {
      console.error("Error fetching recordings:", error);
      throw error;
    }
  },

  /**
   * Get recording details by ID
   */
  async getRecordingById(id: string): Promise<RecordingDetails> {
    try {
      const { data, error } = await supabase
        .from("recordings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      return data as RecordingDetails;
    } catch (error) {
      console.error("Error fetching recording details:", error);
      throw error;
    }
  },

  /**
   * Delete a recording
   */
  async deleteRecording(id: string): Promise<void> {
    try {
      const { error } = await supabase.from("recordings").delete().eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting recording:", error);
      throw error;
    }
  },

  /**
   * Get recordings for the current employee
   * Fetches all recordings and filters results_json to include only the current employee's data
   */
  async getEmployeeRecordings(): Promise<EmployeeRecording[]> {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("User not authenticated");
      }

      // Fetch all recordings with results_json
      const { data, error } = await supabase
        .from("recordings")
        .select("id, video_name, video_duration, created_at, results_json")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter and map recordings to include only current employee's data
      const employeeRecordings: EmployeeRecording[] = [];

      for (const recording of data || []) {
        if (!recording.results_json || !Array.isArray(recording.results_json)) {
          continue;
        }

        // Find the employee's entry in results_json by matching employee_id or email
        const personEntry = (recording.results_json as EmployeePresence[]).find(
          (p: EmployeePresence) =>
            p.employee_id === user.id || p.email === user.email
        );

        if (personEntry) {
          // Convert EmployeePresence to Person format
          const person: Person = {
            name: personEntry.name || null,
            role: personEntry.role || null,
            email: personEntry.email,
            duration:
              typeof personEntry.duration === "number"
                ? personEntry.duration
                : parseInt(
                    String(personEntry.duration).replace(/\D/g, "") || "0"
                  ),
            intervals: personEntry.intervals || [],
            attendance: personEntry.attendance,
            department: personEntry.department || null,
            employee_id: personEntry.employee_id || user.id,
            phone_number: personEntry.phone_number || null,
          };

          employeeRecordings.push({
            id: recording.id,
            video_name: recording.video_name,
            video_url: null, // video_url doesn't exist in schema
            video_duration: recording.video_duration || null,
            created_at: recording.created_at,
            person,
          });
        }
      }

      return employeeRecordings;
    } catch (error) {
      console.error("Error fetching employee recordings:", error);
      throw error;
    }
  },

  /**
   * Get comprehensive analytics for admin dashboard
   * Calculates employee statistics, top performers, and department metrics
   */
  async getAdminAnalytics(): Promise<{
    attendanceAlerts: Array<{
      name: string;
      email: string;
      rate: number;
      department?: string;
    }>;
    activeEmployees: number;
    inactiveEmployees: number;
    peakHours: { hour: number; count: number } | null;
    topPerformers: {
      highestAttendance: Array<{
        name: string;
        email: string;
        rate: number;
        department?: string;
      }>;
      mostConsistent: Array<{
        name: string;
        email: string;
        consistency: number;
        department?: string;
      }>;
      mostImproved: Array<{
        name: string;
        email: string;
        improvement: number;
        department?: string;
      }>;
    };
    departmentStats: Array<{
      department: string;
      employeeCount: number;
      averageAttendance: number;
      totalHours: number;
    }>;
  }> {
    try {
      // Fetch all recordings with results_json
      const { data: recordings, error } = await supabase
        .from("recordings")
        .select("id, video_name, video_duration, created_at, results_json")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!recordings || recordings.length === 0) {
        return {
          attendanceAlerts: [],
          activeEmployees: 0,
          inactiveEmployees: 0,
          peakHours: null,
          topPerformers: {
            highestAttendance: [],
            mostConsistent: [],
            mostImproved: [],
          },
          departmentStats: [],
        };
      }

      // Aggregate employee data across all recordings
      const employeeMap = new Map<
        string,
        {
          name: string;
          email: string;
          department?: string;
          totalPresenceTime: number;
          totalVideoTime: number;
          recordingCount: number;
          presenceSessions: number[];
          attendanceRates: number[];
        }
      >();

      for (const recording of recordings) {
        if (!recording.results_json || !Array.isArray(recording.results_json))
          continue;

        const videoDuration = recording.video_duration || 0;

        (recording.results_json as EmployeePresence[]).forEach((presence) => {
          if (!presence.email && !presence.employee_id) return;

          const key = presence.email || presence.employee_id || "unknown";
          const duration =
            typeof presence.duration === "number"
              ? presence.duration
              : parseInt(String(presence.duration).replace(/\D/g, "") || "0");

          if (!employeeMap.has(key)) {
            employeeMap.set(key, {
              name: presence.name || "Unknown",
              email: presence.email || "",
              department: presence.department || undefined,
              totalPresenceTime: 0,
              totalVideoTime: 0,
              recordingCount: 0,
              presenceSessions: [],
              attendanceRates: [],
            });
          }

          const employee = employeeMap.get(key)!;
          employee.totalPresenceTime += duration;
          employee.totalVideoTime += videoDuration;
          employee.recordingCount += 1;
          employee.presenceSessions.push(duration);

          if (videoDuration > 0) {
            employee.attendanceRates.push((duration / videoDuration) * 100);
          }
        });
      }

      // Calculate metrics for each employee
      const employees = Array.from(employeeMap.values()).map((emp) => {
        const attendanceRate =
          emp.totalVideoTime > 0
            ? (emp.totalPresenceTime / emp.totalVideoTime) * 100
            : 0;

        // Consistency calculation: requires at least 3 recordings for meaningful assessment
        let consistency = 0;
        if (emp.attendanceRates.length >= 3) {
          // Calculate average deviation from mean attendance rate
          const meanRate =
            emp.attendanceRates.reduce((sum, rate) => sum + rate, 0) /
            emp.attendanceRates.length;
          const deviations = emp.attendanceRates.map((rate) =>
            Math.abs(rate - meanRate)
          );
          const averageDeviation =
            deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;

          // Convert to consistency percentage (lower deviation = higher consistency)
          // Maximum reasonable deviation is 50% (from 0% to 100% attendance)
          consistency = Math.max(0, 100 - averageDeviation * 2);
        }

        return {
          ...emp,
          attendanceRate,
          consistency,
          hasMinimumRecordings: emp.attendanceRates.length >= 3,
        };
      });

      // Find top performers
      const sortedByAttendance = [...employees].sort(
        (a, b) => b.attendanceRate - a.attendanceRate
      );

      // Only consider employees with sufficient recordings AND good attendance for consistency ranking
      // Being "consistently bad" shouldn't be rewarded - need 70%+ attendance to qualify
      const eligibleForConsistency = employees.filter(
        (emp) => emp.hasMinimumRecordings && emp.attendanceRate > 70
      );
      const sortedByConsistency = [...eligibleForConsistency].sort(
        (a, b) => b.consistency - a.consistency
      );

      // Calculate improvement (comparing first half vs second half of sessions)
      const employeesWithImprovement = employees.map((emp) => {
        if (emp.attendanceRates.length < 4) return { ...emp, improvement: 0 };

        const midPoint = Math.floor(emp.attendanceRates.length / 2);
        const firstHalf = emp.attendanceRates.slice(0, midPoint);
        const secondHalf = emp.attendanceRates.slice(midPoint);

        const firstAvg =
          firstHalf.reduce((sum, rate) => sum + rate, 0) / firstHalf.length;
        const secondAvg =
          secondHalf.reduce((sum, rate) => sum + rate, 0) / secondHalf.length;

        return { ...emp, improvement: secondAvg - firstAvg };
      });

      const sortedByImprovement = employeesWithImprovement.sort(
        (a, b) => b.improvement - a.improvement
      );

      // Calculate department statistics
      const departmentMap = new Map<
        string,
        {
          employeeCount: number;
          totalPresence: number;
          totalVideo: number;
        }
      >();

      employees.forEach((emp) => {
        const dept = emp.department || "Unknown";
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, {
            employeeCount: 0,
            totalPresence: 0,
            totalVideo: 0,
          });
        }
        const deptData = departmentMap.get(dept)!;
        deptData.employeeCount += 1;
        deptData.totalPresence += emp.totalPresenceTime;
        deptData.totalVideo += emp.totalVideoTime;
      });

      const departmentStats = Array.from(departmentMap.entries())
        .map(([dept, data]) => ({
          department: dept,
          employeeCount: data.employeeCount,
          averageAttendance:
            data.totalVideo > 0
              ? (data.totalPresence / data.totalVideo) * 100
              : 0,
          totalHours: Math.round((data.totalPresence / 3600) * 10) / 10,
        }))
        .sort((a, b) => b.averageAttendance - a.averageAttendance);

      // Calculate new actionable metrics
      const attendanceAlerts = employees
        .filter((emp) => emp.attendanceRate < 70) // Below 70% attendance
        .map((emp) => ({
          name: emp.name,
          email: emp.email,
          rate: Math.round(emp.attendanceRate * 10) / 10,
          department: emp.department,
        }))
        .sort((a, b) => a.rate - b.rate); // Worst performers first

      const activeEmployees = employees.filter(
        (emp) => emp.attendanceRate >= 50
      ).length;
      const inactiveEmployees = employees.filter(
        (emp) => emp.attendanceRate < 50
      ).length;

      // Calculate peak hours (simplified - when most recordings happen)
      const hourCounts = new Map<number, number>();
      recordings.forEach((recording) => {
        const hour = new Date(recording.created_at).getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });

      const peakHours =
        hourCounts.size > 0
          ? Array.from(hourCounts.entries()).reduce(
              (peak, [hour, count]) =>
                count > peak.count ? { hour, count } : peak,
              { hour: 0, count: 0 }
            )
          : null;

      return {
        attendanceAlerts,
        activeEmployees,
        inactiveEmployees,
        peakHours,
        topPerformers: {
          // Find all employees with the highest attendance rate (handle ties)
          highestAttendance:
            sortedByAttendance.length > 0
              ? sortedByAttendance
                  .filter(
                    (emp) =>
                      emp.attendanceRate ===
                      sortedByAttendance[0].attendanceRate
                  )
                  .map((emp) => ({
                    name: emp.name,
                    email: emp.email,
                    rate: Math.round(emp.attendanceRate * 10) / 10,
                    department: emp.department,
                  }))
              : [],

          // Find all employees with the highest consistency (handle ties)
          mostConsistent:
            sortedByConsistency.length > 0
              ? sortedByConsistency
                  .filter(
                    (emp) =>
                      emp.consistency === sortedByConsistency[0].consistency
                  )
                  .map((emp) => ({
                    name: emp.name,
                    email: emp.email,
                    consistency: Math.round(emp.consistency * 10) / 10,
                    department: emp.department,
                  }))
              : [],

          // Find all employees with the highest improvement (handle ties)
          mostImproved:
            sortedByImprovement.length > 0 &&
            sortedByImprovement[0].improvement > 0
              ? sortedByImprovement
                  .filter(
                    (emp) =>
                      emp.improvement === sortedByImprovement[0].improvement
                  )
                  .map((emp) => ({
                    name: emp.name,
                    email: emp.email,
                    improvement: Math.round(emp.improvement * 10) / 10,
                    department: emp.department,
                  }))
              : [],
        },
        departmentStats,
      };
    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      throw error;
    }
  },
};
