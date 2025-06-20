"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import LanguageSelector from "@/components/LanguageSelector"
import { useTranslation } from "../../contexts/TranslationContext"

export default function Congratulations() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      {/* Seletor de idioma */}
      <div className="absolute top-6 right-6 z-[1000]">
        <LanguageSelector />
      </div>
      
      <div className="bg-white/10 rounded-xl shadow-xl p-12 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-4 text-center">Obrigado pela sua compra!</h1>
        <p className="text-lg text-center mb-8">
          Seu pedido foi recebido com sucesso. Em breve entraremos em contato para iniciar a criação do seu logo!
        </p>
        <Link href="/">
          <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 text-lg rounded-lg shadow hover:scale-105 transition">
            Voltar para a Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
