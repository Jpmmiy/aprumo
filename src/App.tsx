import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ProvedorDados } from '@/dados/loja'
import { ProvedorCronometro } from '@/dados/cronometro'
import { Casca } from '@/componentes/Casca'
import { estaLiberado } from '@/lib/acesso'
import { Entrada } from '@/telas/Entrada'
import { Hoje } from '@/telas/Hoje'
import { Estudar } from '@/telas/Estudar'
import { Desempenho } from '@/telas/Desempenho'
import { Rotina } from '@/telas/Rotina'
import { Anotacoes } from '@/telas/Anotacoes'
import { Ajustes } from '@/telas/Ajustes'

/**
 * Os dados ficam no próprio aparelho e a entrada é conferida aqui mesmo, no
 * navegador — o suficiente para o app não ficar aberto, e o que dá para fazer
 * sem servidor. Ver LOVABLE.md para trocar por login e sincronização de
 * verdade.
 */
export function App() {
  const [liberado, setLiberado] = useState(estaLiberado)

  if (!liberado) return <Entrada aoLiberar={() => setLiberado(true)} />

  return (
    <ProvedorDados>
      <ProvedorCronometro>
        <Casca>
          <Routes>
            <Route path="/" element={<Hoje />} />
            <Route path="/estudar" element={<Estudar />} />
            <Route path="/desempenho" element={<Desempenho />} />
            <Route path="/rotina" element={<Rotina />} />
            <Route path="/anotacoes" element={<Anotacoes />} />
            <Route path="/ajustes" element={<Ajustes />} />
            <Route path="*" element={<Hoje />} />
          </Routes>
        </Casca>
      </ProvedorCronometro>
    </ProvedorDados>
  )
}
