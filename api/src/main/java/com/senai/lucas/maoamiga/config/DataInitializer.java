package com.senai.lucas.maoamiga.config;

import com.senai.lucas.maoamiga.entity.Ponto;
import com.senai.lucas.maoamiga.repository.PontoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final PontoRepository pontoRepository;

    @Override
    public void run(String... args) {
        if (pontoRepository.count() > 0) {
            return;
        }

        List<Ponto> iniciais = List.of(
                Ponto.builder()
                        .nome("Ponto de Coleta Setor Bueno")
                        .endereco("Rua T-30, nº 1200, Goiânia-GO")
                        .bairro("Setor Bueno")
                        .horario("Seg a Sex, 8h às 17h")
                        .tipo("coleta")
                        .build(),
                Ponto.builder()
                        .nome("Ponto de Distribuição Vila Nova")
                        .endereco("Avenida Anhanguera, nº 3400, Goiânia-GO")
                        .bairro("Vila Nova")
                        .horario("Sáb, 7h às 12h")
                        .tipo("distribuição")
                        .build(),
                Ponto.builder()
                        .nome("Ponto de Coleta Setor Campinas")
                        .endereco("Rua 3, nº 450, esquina com Av. Goiás, Goiânia-GO")
                        .bairro("Setor Campinas")
                        .horario("Ter, Qui e Sáb, 9h às 15h")
                        .tipo("coleta")
                        .build(),
                Ponto.builder()
                        .nome("Ponto de Distribuição Setor Sul")
                        .endereco("Avenida 85, nº 1500, Goiânia-GO")
                        .bairro("Setor Sul")
                        .horario("Seg, Qua e Sex, 14h às 18h")
                        .tipo("distribuição")
                        .build(),
                Ponto.builder()
                        .nome("Ponto de Coleta Jardim América")
                        .endereco("Rua 90, nº 320, Goiânia-GO")
                        .bairro("Jardim América")
                        .horario("Ter e Qui, 8h às 12h")
                        .tipo("coleta")
                        .build(),
                Ponto.builder()
                        .nome("Ponto de Coleta Setor Pedro Ludovico")
                        .endereco("Avenida Engler, nº 780, Goiânia-GO")
                        .bairro("Setor Pedro Ludovico")
                        .horario("Seg a Sáb, 9h às 16h")
                        .tipo("coleta")
                        .build(),
                Ponto.builder()
                        .nome("Ponto de Distribuição Setor Coimbra")
                        .endereco("Rua Coimbra, nº 210, Goiânia-GO")
                        .bairro("Setor Coimbra")
                        .horario("Qua e Sex, 13h às 17h")
                        .tipo("distribuição")
                        .build(),
                Ponto.builder()
                        .nome("Ponto de Coleta Setor Marista")
                        .endereco("Rua 9, nº 1330, Goiânia-GO")
                        .bairro("Setor Marista")
                        .horario("Sáb e Dom, 8h às 13h")
                        .tipo("coleta")
                        .build()
        );

        pontoRepository.saveAll(iniciais);
    }
}

