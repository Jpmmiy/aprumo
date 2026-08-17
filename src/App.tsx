import { Route, Routes } from 'react-router-dom'
import { ProvedorDados } from '@/dados/loja'
import { ProvedorCronometro } from '@/dados/cronometro'
import { Casca } from '@/componentes/Casca'
import { Hoje } from '@/telas/Hoje'
import { Estudar } from '@/telas/Estudar'
import { Desempenho } from '@/telas/Desempenho'
import { Rotina } from '@/telas/Rotina'
import { Anotacoes } from '@/telas/Anotacoes'
import { Ajustes } from '@/telas/Ajustes'

/**
 * Sem login e sem tela de configuração: os dados ficam no próprio aparelho,
 * então o app abre já usável. Ver LOVABLE.md para ligar sincronização na nuvem.
 */
export function App() {
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
