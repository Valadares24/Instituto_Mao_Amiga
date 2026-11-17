package com.senai.lucas.maoamiga.dto;

import com.senai.lucas.maoamiga.entity.Ponto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PontoRequestDTO(
        @NotBlank(message = "O nome do ponto é obrigatório")
        String nome,

        @NotBlank(message = "O endereço do ponto é obrigatório")
        String endereco,

        @NotBlank(message = "O bairro do ponto é obrigatório")
        String bairro,

        @NotBlank(message = "O horário de funcionamento é obrigatório")
        String horario,

        @NotBlank(message = "O tipo do ponto é obrigatório")
        @Pattern(regexp = "^(coleta|distribuição)$", message = "O tipo deve ser 'coleta' ou 'distribuição'")
        String tipo
) {
    public Ponto toEntity() {
        return Ponto.builder()
                .nome(nome.trim())
                .endereco(endereco.trim())
                .bairro(bairro.trim())
                .horario(horario.trim())
                .tipo(tipo.trim())
                .build();
    }
}

