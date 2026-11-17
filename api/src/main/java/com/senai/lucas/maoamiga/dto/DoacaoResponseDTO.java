package com.senai.lucas.maoamiga.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.senai.lucas.maoamiga.entity.Doacao;

import java.time.LocalDateTime;
import java.util.UUID;

public record DoacaoResponseDTO(
        UUID id,
        String tipoItem,
        Integer quantidade,
        String pontoDestino,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime criadoEm
) {
    public static DoacaoResponseDTO fromEntity(Doacao doacao) {
        return new DoacaoResponseDTO(
                doacao.getId(),
                doacao.getTipoItem(),
                doacao.getQuantidade(),
                doacao.getPontoDestino(),
                doacao.getCriadoEm()
        );
    }
}
