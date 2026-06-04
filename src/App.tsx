/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Wand2, Loader2, Image as ImageIcon, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResultImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateEmbroidery = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      // Extract base64 data and mime type
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: 'Transform this image into a high-quality embroidery style. The result must be identical in composition and content to the original image, but rendered as if it were meticulously hand-stitched onto a vibrant green fabric background. Ensure visible thread textures, satin stitches for the white text and stick figure, and a realistic embroidered appearance. The background must be solid green fabric.',
            },
          ],
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setResultImage(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("No image was generated in the response.");
      }
    } catch (err) {
      console.error("Error generating embroidery:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'embroidered-art.png';
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="border-b border-white/10 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Wand2 className="text-black" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">StitchAI</h1>
              <p className="text-xs text-white/50 uppercase tracking-widest">Embroidery Studio</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: Upload & Controls */}
          <section className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-light leading-tight">
                Turn your <span className="italic text-orange-500">designs</span> into <br />
                digital <span className="font-medium">embroidery</span>.
              </h2>
              <p className="text-white/60 text-lg max-w-md">
                Upload any graphic or text and watch our AI recreate it with realistic thread textures and stitching.
              </p>
            </div>

            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 transition-all duration-300
                  ${image ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                {image ? (
                  <div className="relative aspect-square rounded-xl overflow-hidden shadow-2xl">
                    <img src={image} alt="Source" className="w-full h-full object-contain bg-black/40" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-sm font-medium">Change Image</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="text-white/40 group-hover:text-white" size={32} />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium">Click to upload</p>
                      <p className="text-sm text-white/40">PNG, JPG or SVG up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={generateEmbroidery}
                disabled={!image || loading}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                  ${!image || loading 
                    ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                    : 'bg-orange-500 text-black hover:bg-orange-400 active:scale-[0.98] shadow-xl shadow-orange-500/20'}
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Stitching...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={24} />
                    <span>Transform to Embroidery</span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          </section>

          {/* Right Column: Result Display */}
          <section className="relative">
            <div className="sticky top-12">
              <div className="aspect-square rounded-3xl bg-white/[0.02] border border-white/10 overflow-hidden relative shadow-2xl">
                <AnimatePresence mode="wait">
                  {resultImage ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-full p-4"
                    >
                      <div className="w-full h-full rounded-2xl overflow-hidden bg-[#0a1a0a] shadow-inner relative group border border-green-900/30">
                        <img src={resultImage} alt="Embroidered Result" className="w-full h-full object-contain" />
                        <button 
                          onClick={downloadImage}
                          className="absolute bottom-6 right-6 p-4 bg-white text-black rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95"
                        >
                          <Download size={24} />
                        </button>
                      </div>
                    </motion.div>
                  ) : loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full flex flex-col items-center justify-center space-y-6"
                    >
                      <div className="relative">
                        <Loader2 className="animate-spin text-orange-500" size={64} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-xl font-medium">Creating your masterpiece</p>
                        <p className="text-sm text-white/40 italic">Simulating thread patterns and textures...</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full h-full flex flex-col items-center justify-center text-white/20 p-12 text-center"
                    >
                      <ImageIcon size={80} strokeWidth={1} className="mb-6 opacity-50" />
                      <p className="text-xl font-medium">Your embroidered art <br /> will appear here</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Decorative elements */}
              <div className="absolute -z-10 -top-12 -right-12 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full" />
              <div className="absolute -z-10 -bottom-12 -left-12 w-64 h-64 bg-green-500/10 blur-[100px] rounded-full" />
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-white/40 text-sm">
          <p>© 2026 StitchAI Studio. Powered by Gemini Vision.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
