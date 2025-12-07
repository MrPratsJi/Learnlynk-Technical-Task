import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type CreateTaskPayload = {
  application_id: string;
  task_type: string;
  due_at: string;
};

const VALID_TYPES = ["call", "email", "review"];

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Partial<CreateTaskPayload>;
    const application_id = body.application_id;
    const task_type = body.task_type;
    const due_at = body.due_at;

    if (!application_id || !task_type || !due_at) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!VALID_TYPES.includes(task_type)) {
      return new Response(JSON.stringify({ error: "Invalid task_type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const dueDate = new Date(due_at);
    if (Number.isNaN(dueDate.getTime())) {
      return new Response(JSON.stringify({ error: "Invalid due_at timestamp" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    if (dueDate.getTime() <= now.getTime()) {
      return new Response(JSON.stringify({ error: "due_at must be in the future" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, tenant_id")
      .eq("id", application_id)
      .single();

    if (appError || !application) {
      return new Response(JSON.stringify({ error: "Invalid application_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        tenant_id: application.tenant_id,
        application_id,
        type: task_type,
        due_at,
        status: "open",
      })
      .select("id, application_id, type, due_at")
      .single();

    if (taskError || !task) {
      return new Response(JSON.stringify({ error: "Failed to create task" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const channel = supabase.channel("tasks");

    await channel.send({
      type: "broadcast",
      event: "task.created",
      payload: {
        task_id: task.id,
        application_id: task.application_id,
        type: task.type,
        due_at: task.due_at,
      },
    });

    return new Response(JSON.stringify({ success: true, task_id: task.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
