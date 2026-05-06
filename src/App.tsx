/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./lib/store";
import { MainLayout } from "./components/MainLayout";
import { NoteList } from "./components/NoteList";
import { EditorView } from "./components/EditorView";
import { CanvasView } from "./components/CanvasView";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<NoteList />} />
            <Route path="group/:groupId" element={<NoteList />} />
            <Route path="trash" element={<NoteList isTrash />} />
            <Route path="locked" element={<NoteList isLocked />} />
            <Route path="note/:id" element={<EditorView />} />
            <Route path="canvas/:id" element={<CanvasView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
