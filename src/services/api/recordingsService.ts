import supabase from "../supabaseClient";
import { RecordingResult, RecordingDetails } from "../../types/models";

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

      // Store metadata in Supabase (not the video itself)
      const { data: recordingData, error } = await supabase
        .from("recordings")
        .insert({
          video_name: data.video_file || "unknown_video",
          status: "completed",
          results_json: data.results,
          processed_at: new Date().toISOString(),
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
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
};
