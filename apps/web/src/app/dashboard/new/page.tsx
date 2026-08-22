"use client";

import { RouteForm } from "@/components/RouteForm";

export default function NewRoutePage() {
  return (
    <div>
      <h1 className="page-title">Новый маршрут</h1>
      <RouteForm mode="create" />
    </div>
  );
}